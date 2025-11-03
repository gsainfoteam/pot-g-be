import { Injectable } from "@nestjs/common";
import { LoginRequestDto, LoginResponseDto } from "@src/user/dto/login.dto";
import { BaseResultDto } from "@src/global/dto/base-result.dto";
import { SetDeviceInfoRequestDto } from "@src/user/dto/set-fcm.dto";
import { UserInfoDto } from "@src/user/dto/user-info.dto";
import { PushSettingDto } from "@src/user/dto/push-setting.dto";
import { UserContext } from "@src/auth/user-context.entity";
import { InfoteamIdpService } from "@lib/infoteam-idp";
import { UserRepository } from "@src/database/repository/user.repository";
import { AuthService } from "@src/auth/auth.service";
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

@Injectable()
export class UserService {
  constructor(
    private readonly dbService: DatabaseService,
    private readonly idpService: InfoteamIdpService,
    private readonly authService: AuthService,
    private readonly userRepository: UserRepository,
    private readonly deviceRepository: DeviceRepository,
    private readonly userAlarmSettingRepository: UserAlarmSettingRepository,
    private readonly userConsentRepository: UserConsentRepository,
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
      throw new Error("Invalid refresh token"); // TODO
    }

    const user = await this.userRepository.findUserByPk(userId);
    if (!user) {
      throw new Error("User not found"); // TODO
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
      throw new Error("Device not found"); // TODO
    }

    let updated = false;

    if (!!fcmToken) {
      device.fcmToken = fcmToken;
      updated = true;
    }
    if (!!os) {
      device.os = os;
      updated = true;
    }
    if (!!version) {
      device.version = version;
      updated = true;
    }

    if (!updated) {
      return BaseResultDto.OK; // 변경된 정보가 없으면 바로 반환
    }

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
      throw new Error("User not found"); // TODO
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
    // TODO
    // 모든 사용자의 팟으로부터 사용자를 제거

    // 사용자의 계좌 정보 삭제

    await this.dbService.db.transaction(async (tx: TxType) => {
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
      throw new Error("Failed to create new user"); // TODO
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
        os: "iOS", // OS 정보는 추후에 업데이트 필요
        version: "0.0.1", // 초기 버전 정보
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
