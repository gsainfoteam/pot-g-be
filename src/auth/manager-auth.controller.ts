import { Body, Controller, Post } from "@nestjs/common";
import { ManagerAuthService } from "@src/auth/manager-auth.service";
import {
  ManagerLoginRequestDto,
  ManagerLoginResponseDto,
} from "@src/auth/dto/manager-login.dto";

@Controller("/api/manager/v1/auth")
export class ManagerAuthController {
  constructor(private readonly managerAuthService: ManagerAuthService) {}

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
}
