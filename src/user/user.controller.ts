import { ApiInternalServerErrorResponse } from "@nestjs/swagger";
import { HttpErrorDto } from "@src/global/dto/http-error.dto";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";
import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { UserService } from "@src/user/user.service";
import { LoginRequestDto, LoginResponseDto } from "@src/user/dto/login.dto";
import {
  RefreshRequestDto,
  RefreshResponseDto,
} from "@src/user/dto/refresh.dto";
import { BaseResultDto } from "@src/global/dto/base-result.dto";
import { SetDeviceInfoRequestDto } from "@src/user/dto/set-fcm.dto";
import { UserInfoDto } from "@src/user/dto/user-info.dto";
import { PushSettingDto } from "@src/user/dto/push-setting.dto";
import { UserGuard } from "@src/auth/guard/user.guard";
import { GetUser } from "@src/global/decorator/get-user.decorator";
import { UserContext } from "@src/auth/context/user-context.entity";
import { UpdateConsentDto } from "@src/user/dto/update-consent.dto";
import { LogoutRequestDto } from "@src/user/dto/logout.dto";

@ApiInternalServerErrorResponse({
  type: HttpErrorDto,
  description: "서버 내부 오류",
})
@ApiTags("User")
@Controller("/api/v1/user")
export class UserController {
  constructor(private readonly userService: UserService) {}

  @ApiResponse({
    status: 400,
    type: HttpErrorDto,
    description: "잘못된 요청 또는 입력값 검증 실패",
  })
  @ApiOperation({ summary: "IDP 토큰으로 로그인" })
  @ApiResponse({ status: 201, type: LoginResponseDto })
  @Post("/login")
  async login(@Body() req: LoginRequestDto): Promise<LoginResponseDto> {
    return await this.userService.login(req);
  }

  @ApiResponse({
    status: 400,
    type: HttpErrorDto,
    description: "잘못된 요청 또는 입력값 검증 실패",
  })
  @ApiResponse({
    status: 401,
    type: HttpErrorDto,
    description: "유효하지 않은 인증 정보",
  })
  @ApiOperation({ summary: "액세스 토큰 갱신" })
  @ApiResponse({ status: 201, type: RefreshResponseDto })
  @Post("/refresh")
  async refresh(@Body() req: RefreshRequestDto): Promise<RefreshResponseDto> {
    return this.userService.refresh(req);
  }

  @ApiResponse({
    status: 400,
    type: HttpErrorDto,
    description: "잘못된 요청 또는 입력값 검증 실패",
  })
  @ApiResponse({
    status: 403,
    type: HttpErrorDto,
    description: "사용자 기기를 찾을 수 없습니다.",
  })
  @ApiOperation({ summary: "기기 및 FCM 토큰 등록" })
  @ApiBearerAuth("user-access-token")
  @ApiUnauthorizedResponse({
    type: HttpErrorDto,
    description: "인증 토큰이 없거나 유효하지 않습니다.",
  })
  @ApiResponse({ status: 201, type: BaseResultDto })
  @Post("/device")
  @UseGuards(UserGuard)
  async setDeviceInfo(
    @Body() req: SetDeviceInfoRequestDto,
    @GetUser() userCtx: UserContext,
  ): Promise<BaseResultDto> {
    return this.userService.setDeviceInfo(req, userCtx);
  }

  @ApiOperation({ summary: "내 정보 조회" })
  @ApiBearerAuth("user-access-token")
  @ApiUnauthorizedResponse({
    type: HttpErrorDto,
    description: "인증 토큰이 없거나 유효하지 않습니다.",
  })
  @ApiResponse({ status: 200, type: UserInfoDto })
  @Get("/info")
  @UseGuards(UserGuard)
  async getUserInfo(@GetUser() userCtx: UserContext): Promise<UserInfoDto> {
    return this.userService.getUserInfo(userCtx);
  }

  @ApiResponse({
    status: 400,
    type: HttpErrorDto,
    description: "잘못된 요청 또는 입력값 검증 실패",
  })
  @ApiOperation({ summary: "푸시 알림 설정 변경" })
  @ApiBearerAuth("user-access-token")
  @ApiUnauthorizedResponse({
    type: HttpErrorDto,
    description: "인증 토큰이 없거나 유효하지 않습니다.",
  })
  @ApiResponse({ status: 201, type: PushSettingDto })
  @Post("/push")
  @UseGuards(UserGuard)
  async setPushSettings(
    @Body() req: PushSettingDto,
    @GetUser() userCtx: UserContext,
  ): Promise<PushSettingDto> {
    return this.userService.setPushSettings(req, userCtx);
  }

  @ApiOperation({ summary: "회원 탈퇴" })
  @ApiBearerAuth("user-access-token")
  @ApiUnauthorizedResponse({
    type: HttpErrorDto,
    description: "인증 토큰이 없거나 유효하지 않습니다.",
  })
  @ApiResponse({ status: 201, type: BaseResultDto })
  @Post("/withdraw")
  @UseGuards(UserGuard)
  async withdraw(@GetUser() userCtx: UserContext): Promise<BaseResultDto> {
    return this.userService.withdraw(userCtx);
  }

  @ApiResponse({
    status: 400,
    type: HttpErrorDto,
    description: "잘못된 요청 또는 입력값 검증 실패",
  })
  @ApiOperation({ summary: "약관 동의 갱신" })
  @ApiBearerAuth("user-access-token")
  @ApiUnauthorizedResponse({
    type: HttpErrorDto,
    description: "인증 토큰이 없거나 유효하지 않습니다.",
  })
  @ApiResponse({ status: 201, type: BaseResultDto })
  @Post("/consent")
  @UseGuards(UserGuard)
  async consent(
    @Body() req: UpdateConsentDto,
    @GetUser() userCtx: UserContext,
  ): Promise<BaseResultDto> {
    return this.userService.consent(req, userCtx);
  }

  @ApiResponse({
    status: 400,
    type: HttpErrorDto,
    description: "잘못된 요청 또는 입력값 검증 실패",
  })
  @ApiOperation({ summary: "로그아웃" })
  @ApiBearerAuth("user-access-token")
  @ApiUnauthorizedResponse({
    type: HttpErrorDto,
    description: "인증 토큰이 없거나 유효하지 않습니다.",
  })
  @ApiResponse({ status: 201, type: BaseResultDto })
  @Post("/logout")
  @UseGuards(UserGuard)
  async logout(
    @Body() req: LogoutRequestDto,
    @GetUser() userCtx: UserContext,
  ): Promise<BaseResultDto> {
    return this.userService.logout(req, userCtx);
  }
}
