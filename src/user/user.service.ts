import { Injectable } from "@nestjs/common";
import { LoginRequestDto, LoginResponseDto } from "@src/user/dto/login.dto";
import { BaseResultDto } from "@src/global/dto/base-result.dto";
import { SetFcmRequestDto } from "@src/user/dto/set-fcm.dto";
import { UserInfoDto } from "@src/user/dto/user-info.dto";
import { PushSettingDto } from "@src/user/dto/push-setting.dto";
import { UserContext } from "@src/auth/user-context.entity";
import { InfoteamIdpService } from "@lib/infoteam-idp";
import { UserRepository } from "@src/user/user.repository";
import { AuthService } from "@src/auth/auth.service";

@Injectable()
export class UserService {
  constructor(
    private readonly idpService: InfoteamIdpService,
    private readonly userRepository: UserRepository,
    private readonly authService: AuthService,
  ) {}

  async login(
    req: LoginRequestDto,
  ): Promise<LoginResponseDto & { refresh_token: string }> {
    // IDP Authorization Code 를 받아 팟쥐 자체 JWT 토큰을 발급합니다.
    // 팟쥐 JWT 토큰의 유효 기간은 IDP 토큰의 유효기간과 동일합니다.

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
      user = await this.userRepository.insert({
        isDeleted: false,
        idpSub: sub,
        name,
        email,
        studentId,
      });
    }

    const { accessToken, refreshToken } =
      await this.authService.createNewJwtToken(user);

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
    };
  }

  async refresh(): Promise<LoginResponseDto> {
    // Access Token 을 갱신해 줍니다.
    // 팟쥐 JWT 토큰 기간의 유효기간은 IDP 토큰의 유효기간과 동일하기 때문에
    // IDP 토큰의 갱신도 동시에 진행합니다.
  }

  async setFcmToken(
    req: SetFcmRequestDto,
    userCtx: UserContext,
  ): Promise<BaseResultDto> {
    // 사용자 디바이스의 FCM 토큰을 세팅합니다.
  }

  async getUserInfo(userCtx: UserContext): Promise<UserInfoDto> {
    // 사용자 정보를 조회합니다.
  }

  async setPushSettings(
    req: PushSettingDto,
    userCtx: UserContext,
  ): Promise<PushSettingDto> {
    // 알림 설정 정보를 업데이트합니다.
  }

  async withdraw(userCtx: UserContext): Promise<BaseResultDto> {
    // 회원 탍퇴를 진행합니다.
  }
}
