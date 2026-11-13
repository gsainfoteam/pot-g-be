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
import { ManagerAuthService } from "@src/auth/manager-auth.service";
import {
  ManagerLoginRequestDto,
  ManagerLoginResponseDto,
  ManagerMeResponseDto,
} from "@src/auth/dto/manager-login.dto";
import { ManagerGuard } from "@src/auth/guard/manager.guard";
import { GetManager } from "@src/global/decorator/get-manager.decorator";
import { ManagerContext } from "@src/auth/context/manager-context.entity";

@ApiInternalServerErrorResponse({
  type: HttpErrorDto,
  description: "서버 내부 오류",
})
@ApiTags("ManagerAuth")
@Controller("/api/manager/v1/auth")
export class ManagerAuthController {
  constructor(private readonly managerAuthService: ManagerAuthService) {}

  @ApiResponse({
    status: 400,
    type: HttpErrorDto,
    description: "잘못된 요청 또는 입력값 검증 실패",
  })
  @ApiResponse({
    status: 403,
    type: HttpErrorDto,
    description: "접근 권한 없음",
  })
  @ApiOperation({ summary: "관리자 OAuth 로그인" })
  @ApiResponse({ status: 201, type: ManagerLoginResponseDto })
  @Post("/login")
  async login(
    @Body() req: ManagerLoginRequestDto,
  ): Promise<ManagerLoginResponseDto> {
    const { accessToken } = await this.managerAuthService.login(
      req.code,
      req.redirect_uri,
      req.code_verifier,
    );

    return { access_token: accessToken };
  }

  // 현재 로그인한 매니저의 계정 정보 (role 은 DB 의 현재 값입니다)
  @ApiResponse({
    status: 403,
    type: HttpErrorDto,
    description: "접근 권한 없음",
  })
  @ApiOperation({ summary: "내 관리자 정보 조회" })
  @ApiBearerAuth("manager-access-token")
  @ApiUnauthorizedResponse({
    type: HttpErrorDto,
    description: "인증 토큰이 없거나 유효하지 않습니다.",
  })
  @ApiResponse({ status: 200, type: ManagerMeResponseDto })
  @Get("/me")
  @UseGuards(ManagerGuard)
  me(@GetManager() managerCtx: ManagerContext): ManagerMeResponseDto {
    return { email: managerCtx.email, role: managerCtx.role };
  }
}
