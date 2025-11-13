import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from "@nestjs/common";
import { LoginRequestDto, LoginResponseDto } from "@src/user/dto/login.dto";
import { BaseResultDto } from "@src/global/dto/base-result.dto";
import { SetDeviceInfoRequestDto } from "@src/user/dto/set-fcm.dto";
import { UserInfoDto } from "@src/user/dto/user-info.dto";
import { PushSettingDto } from "@src/user/dto/push-setting.dto";
import { UserContext } from "@src/auth/context/user-context.entity";
import { InfoteamIdpService } from "@lib/infoteam-idp";
import { UserRepository } from "@src/database/repository/user.repository";
import { UserAuthService } from "@src/auth/user-auth.service";
import { DatabaseService } from "@src/database/database.service";
import { TxType } from "@src/global/types/tx.types";
import { DeviceRepository } from "@src/database/repository/device.repository";
import { UserAlarmSettingRepository } from "@src/database/repository/user-alarm-setting.repository";
import {
  RefreshRequestDto,
  RefreshResponseDto,
} from "@src/user/dto/refresh.dto";
import { DeviceEntity } from "@src/database/entity/device.entity";
import { UserEntity } from "@src/database/entity/user.entity";
import { UpdateConsentDto } from "@src/user/dto/update-consent.dto";
import { UserConsentRepository } from "@src/database/repository/user-consent.repository";
import { UserConsentEntity } from "@src/database/entity/user-consent.entity";
import { LogoutRequestDto } from "@src/user/dto/logout.dto";
import { RefreshTokenRepository } from "@src/database/repository/refresh-token.repository";
import { UserBankRepository } from "@src/database/repository/user-bank.repository";
import { BroadcastingService } from "@src/broadcasting/broadcasting.service";

@Injectable()
export class UserService {
  constructor(
    private readonly dbService: DatabaseService,
    private readonly idpService: InfoteamIdpService,
    private readonly authService: UserAuthService,
    private readonly userRepository: UserRepository,
    private readonly deviceRepository: DeviceRepository,
    private readonly userAlarmSettingRepository: UserAlarmSettingRepository,
    private readonly userConsentRepository: UserConsentRepository,
    private readonly refreshTokenRepository: RefreshTokenRepository,
    private readonly userBankRepository: UserBankRepository,
    private readonly broadcastingService: BroadcastingService,
  ) {}

  async login(
    req: LoginRequestDto,
  ): Promise<LoginResponseDto & { refresh_token: string }> {
    const idpToken = req.token;
    const {
      uuid: sub,
      name,
      email,
    } = await this.idpService.validateAccessToken(idpToken);

    let user = await this.userRepository.findUserByIdpSub(sub);
    let device: DeviceEntity;

    const { accessToken, refreshToken } = await this.dbService.db.transaction(
      async (tx: TxType) => {
        if (!user) {
          // 사용자가 존재하지 않는 경우, 새로 생성합니다.
          user = await this.createNewUser(sub, name, email, tx);
          device = await this.createNewDevice(user, req.device_id, tx);
        } else {
          device = await this.deviceRepository.findByDeviceIdAndUserFk(
            req.device_id,
            user.pk,
          );
          if (!device) {
            device = await this.createNewDevice(user, req.device_id, tx);
          }
        }

        return await this.authService.createNewJwtToken(user, device, tx);
      },
    );

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
    };
  }

  async refresh(req: RefreshRequestDto): Promise<RefreshResponseDto> {
    const { userId, devicePk } = await this.authService.validateOpaqueHash(
      req.refresh_token,
    );
    if (!userId) {
      throw new UnauthorizedException("Invalid refresh token");
    }

    const user = await this.userRepository.findUserByPk(userId);
    if (!user) {
      throw new UnauthorizedException("User Not Found");
    }

    const { accessToken } = await this.authService.refreshAccessToken(
      user,
      devicePk,
    );
    return { access_token: accessToken };
  }

  async setDeviceInfo(
    req: SetDeviceInfoRequestDto,
    userCtx: UserContext,
  ): Promise<BaseResultDto> {
    // 사용자 디바이스 정보를 업데이트합니다.
    const { fcm_token: fcmToken, os, version } = req;

    const device = await this.deviceRepository.findByPkAndUserFk(
      userCtx.devicePk,
      userCtx.userId,
    );
    if (!device) {
      throw new ForbiddenException("Device not found");
    }

    if (!!fcmToken) {
      device.fcmToken = fcmToken;
    }
    if (!!os) {
      device.os = os;
    }
    if (!!version) {
      device.version = version;
    }

    device.loggedIn = true;

    await this.dbService.db.transaction(async (tx: TxType) => {
      await this.deviceRepository.update(device, tx);
    });

    return BaseResultDto.OK;
  }

  async getUserInfo(userCtx: UserContext): Promise<UserInfoDto> {
    // 사용자 정보와 이용약관 동의 여부를 조회합니다.
    const [userInfo, userConsents] = await Promise.all([
      this.userRepository.getUserInfoByPk(userCtx.userId, userCtx.devicePk),
      this.userConsentRepository.findByUserFk(userCtx.userId),
    ]);

    if (!userInfo) {
      throw new UnauthorizedException("User Not Found");
    }

    return {
      id: userInfo.pk,
      name: userInfo.name,
      email: userInfo.email,
      push_setting: userInfo.pushSetting,
      accounting: userInfo.accounting,
      terms: userConsents.map((consent) => consent.term),
    };
  }

  async setPushSettings(
    req: PushSettingDto,
    userCtx: UserContext,
  ): Promise<PushSettingDto> {
    const userAlarmSetting =
      await this.userAlarmSettingRepository.findByDeviceFk(userCtx.devicePk);
    if (!userAlarmSetting) {
      const newUserAlarmSetting = {
        deviceFk: userCtx.devicePk,
        chatPush: req.chat_push ? req.chat_push : false,
        marketingPush: req.marketing_push ? req.marketing_push : false,
        potInOutPush: req.pot_in_out_push ? req.pot_in_out_push : false,
      };

      await this.dbService.db.transaction(async (tx: TxType) => {
        await this.userAlarmSettingRepository.insert(newUserAlarmSetting, tx);
      });
      return {
        chat_push: newUserAlarmSetting.chatPush,
        marketing_push: newUserAlarmSetting.marketingPush,
        pot_in_out_push: newUserAlarmSetting.potInOutPush,
      };
    }

    let updated = false;
    if (req.chat_push != null && userAlarmSetting.chatPush !== req.chat_push) {
      userAlarmSetting.chatPush = req.chat_push;
      updated = true;
    }
    if (
      req.marketing_push != null &&
      userAlarmSetting.marketingPush !== req.marketing_push
    ) {
      userAlarmSetting.marketingPush = req.marketing_push;
      updated = true;
    }
    if (
      req.pot_in_out_push != null &&
      userAlarmSetting.potInOutPush !== req.pot_in_out_push
    ) {
      userAlarmSetting.potInOutPush = req.pot_in_out_push;
      updated = true;
    }
    if (updated) {
      await this.dbService.db.transaction(async (tx: TxType) => {
        await this.userAlarmSettingRepository.update(userAlarmSetting, tx);
      });
    }

    return {
      chat_push: userAlarmSetting.chatPush,
      marketing_push: userAlarmSetting.marketingPush,
      pot_in_out_push: userAlarmSetting.potInOutPush,
    }; // 업데이트된 설정을 반환
  }

  async withdraw(userCtx: UserContext): Promise<BaseResultDto> {
    // 사용자의 ws 연결 모두 해제
    this.broadcastingService.disconnectUser(userCtx.userId);

    // TODO
    // 사용자의 모든 액티브 팟으로부터 사용자 퇴장

    // 쿼리의 개수가 꽤 많기 때문에 트랜잭션으로 묶고 하나하나 처리합니다.
    await this.dbService.db.transaction(async (tx: TxType) => {
      // user alarm setting 물리 삭제
      await this.userAlarmSettingRepository.deleteByUserFk(userCtx.userId, tx);
      // 사용자의 계좌 정보 물리 삭제
      await this.userBankRepository.deleteByUserPk(userCtx.userId, tx);
      // user consent 물리 삭제
      await this.userConsentRepository.deleteByUserFk(userCtx.userId, tx);
      // refresh token 물리 삭제
      await this.refreshTokenRepository.deleteByUserPk(userCtx.userId, tx);
      // device 논리적 비활성화 (log out)
      await this.deviceRepository.logoutAllWithUserFk(userCtx.userId, tx);
      // user 테이블에서 논리 삭제
      await this.userRepository.withdraw(userCtx.userId, tx);
    });

    return BaseResultDto.OK;
  }

  async consent(
    req: UpdateConsentDto,
    userCtx: UserContext,
  ): Promise<BaseResultDto> {
    const userConsents = await this.userConsentRepository.findByUserFk(
      userCtx.userId,
    );

    // Normalize inputs and dedupe against existing consents
    const requiredTerms = req.required_terms ?? [];
    const optionalTerms = req.optional_terms ?? [];
    const existingTerms = new Set(userConsents.map((uc) => uc.term));

    const termsToInsert = [...requiredTerms, ...optionalTerms].filter(
      (term) => {
        if (existingTerms.has(term)) {
          return false;
        }
        existingTerms.add(term);
        return true;
      },
    );

    if (termsToInsert.length === 0) {
      return BaseResultDto.OK; // 추가할 동의 항목이 없으면 바로 반환
    }

    const newUserConsents: UserConsentEntity[] = termsToInsert.map((term) => ({
      userFk: userCtx.userId,
      term,
    }));

    await this.dbService.db.transaction(async (tx: TxType) => {
      await this.userConsentRepository.bulkInsert(newUserConsents, tx);
    });

    return BaseResultDto.OK;
  }

  async logout(
    req: LogoutRequestDto,
    userCtx: UserContext,
  ): Promise<BaseResultDto> {
    const device = await this.deviceRepository.findByPkAndUserFk(
      userCtx.devicePk,
      userCtx.userId,
    );

    if (!device) {
      return BaseResultDto.OK;
    }

    device.loggedIn = false;

    await this.dbService.db.transaction(async (tx: TxType) => {
      await this.refreshTokenRepository.deleteByOpaqueHash(
        req.refresh_token,
        tx,
      );
      await this.deviceRepository.update(device, tx);
    });

    return BaseResultDto.OK;
  }

  private async createNewUser(
    sub: string,
    name: string,
    email: string,
    tx: TxType,
  ) {
    const user = await this.userRepository.insert(
      {
        isDeleted: false,
        idpSub: sub,
        name,
        email,
      },
      tx,
    );

    if (!user) {
      throw new InternalServerErrorException("Failed to create new user");
    }

    return user;
  }

  private async createNewDevice(
    user: UserEntity,
    deviceId: string,
    tx: TxType,
  ) {
    // insert device
    const device = await this.deviceRepository.insert(
      {
        userFk: user.pk,
        fcmToken: "", // 초기값은 빈 문자열로 설정
        deviceId: deviceId,
        os: "", // OS 정보는 추후에 업데이트 필요
        version: "", // 초기 버전 정보
        loggedIn: false,
      },
      tx,
    );

    // insert user_alarm_setting
    await this.userAlarmSettingRepository.insert(
      {
        deviceFk: device.pk,
        chatPush: true,
        marketingPush: true,
        potInOutPush: true,
      },
      tx,
    );

    return device;
  }
}
