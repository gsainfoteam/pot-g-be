import { Injectable } from "@nestjs/common";
import { LoginRequestDto, LoginResponseDto } from "@src/user/dto/login.dto";
import { BaseResultDto } from "@src/global/dto/base-result.dto";
import { SetDeviceInfoRequestDto } from "@src/user/dto/set-fcm.dto";
import { UserInfoDto } from "@src/user/dto/user-info.dto";
import { PushSettingDto } from "@src/user/dto/push-setting.dto";
import { UserContext } from "@src/auth/user-context.entity";
import { InfoteamIdpService } from "@lib/infoteam-idp";
import { UserRepository } from "@src/user/repository/user.repository";
import { AuthService } from "@src/auth/auth.service";
import { DatabaseService } from "@src/database/database.service";
import { TxType } from "@src/global/types/tx.types";
import { DeviceRepository } from "@src/user/repository/device.repository";
import { UserAlarmSettingRepository } from "@src/user/repository/user-alarm-setting.repository";

@Injectable()
export class UserService {
  constructor(
    private readonly dbService: DatabaseService,
    private readonly idpService: InfoteamIdpService,
    private readonly authService: AuthService,
    private readonly userRepository: UserRepository,
    private readonly deviceRepository: DeviceRepository,
    private readonly userAlarmSettingRepository: UserAlarmSettingRepository,
  ) {}

  async login(
    req: LoginRequestDto,
  ): Promise<LoginResponseDto & { refresh_token: string }> {
    const idpToken = req.token;
    const {
      uuid: sub,
      name,
      email,
      studentId,
    } = await this.idpService.validateAccessToken(idpToken);

    let user = await this.userRepository.findUserByIdpSub(sub);
    if (!user) {
      // 사용자가 존재하지 않는 경우, 새로 생성합니다.
      user = await this.createNewUser(sub, name, email, studentId);
    }

    const { accessToken, refreshToken } =
      await this.authService.createNewJwtToken(user);

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
    };
  }

  async refresh(refreshToken: string): Promise<LoginResponseDto> {
    const { userId } =
      await this.authService.validateRefreshToken(refreshToken);
    if (!userId) {
      throw new Error("Invalid refresh token"); // TODO
    }

    const user = await this.userRepository.findUserByPk(userId);
    if (!user) {
      throw new Error("User not found"); // TODO
    }

    const { accessToken } = await this.authService.refreshAccessToken(user);
    return { access_token: accessToken };
  }

  async setDeviceInfo(
    req: SetDeviceInfoRequestDto,
    userCtx: UserContext,
  ): Promise<BaseResultDto> {
    // 사용자 디바이스 정보를 업데이트합니다.
    const { fcm_token: fcmToken, os, version } = req;

    const device = await this.deviceRepository.findByPkAndUserFk(
      userCtx.deviceId,
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
    // 사용자 정보를 조회합니다.
    const userInfo = await this.userRepository.getUserInfoByPk(
      userCtx.userId,
      userCtx.deviceId,
    );
    if (!userInfo) {
      throw new Error("User not found"); // TODO
    }

    return {
      name: userInfo.name,
      email: userInfo.email,
      push_setting: userInfo.pushSetting,
      accounting: userInfo.accounting,
    };
  }

  async setPushSettings(
    req: PushSettingDto,
    userCtx: UserContext,
  ): Promise<PushSettingDto> {
    const userAlarmSetting =
      await this.userAlarmSettingRepository.findByDeviceFk(userCtx.deviceId);
    if (!userAlarmSetting) {
      throw new Error("User alarm setting not found"); // TODO
    }

    let updated = false;
    if (!!req.any_push && userAlarmSetting.anyPush !== req.any_push) {
      userAlarmSetting.anyPush = req.any_push;
      updated = true;
    }
    if (!!req.chat_push && userAlarmSetting.chatPush !== req.chat_push) {
      userAlarmSetting.chatPush = req.chat_push;
      updated = true;
    }
    if (
      !!req.marketing_push &&
      userAlarmSetting.marketingPush !== req.marketing_push
    ) {
      userAlarmSetting.marketingPush = req.marketing_push;
      updated = true;
    }
    if (
      !!req.pot_in_out_push &&
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
      any_push: userAlarmSetting.anyPush,
      chat_push: userAlarmSetting.chatPush,
      marketing_push: userAlarmSetting.marketingPush,
      pot_in_out_push: userAlarmSetting.potInOutPush,
    }; // 업데이트된 설정을 반환
  }

  async withdraw(userCtx: UserContext): Promise<BaseResultDto> {
    // 회원 탍퇴를 진행합니다.
  }

  private async createNewUser(
    sub: string,
    name: string,
    email: string,
    studentId: string,
  ) {
    return await this.dbService.db.transaction(async (tx: TxType) => {
      const user = await this.userRepository.insert(
        {
          isDeleted: false,
          idpSub: sub,
          name,
          email,
          studentId,
        },
        tx,
      );

      if (!user) {
        throw new Error("Failed to create new user"); // TODO
      }

      // insert device
      const device = await this.deviceRepository.insert(
        {
          userFk: user.pk,
          fcmToken: "", // 초기값은 빈 문자열로 설정
          os: "unknown", // OS 정보는 추후에 업데이트 필요
          version: "0.0.1", // 초기 버전 정보
        },
        tx,
      );

      // insert user_alarm_setting
      await this.userAlarmSettingRepository.insert(
        {
          deviceFk: device.pk,
          anyPush: true, // 기본값은 true로 설정
          chatPush: true,
          marketingPush: true,
          potInOutPush: true,
        },
        tx,
      );

      return user;
    });
  }
}
