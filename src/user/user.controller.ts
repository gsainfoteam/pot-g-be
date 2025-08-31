import { Body, Controller, Get, Post, Res, UseGuards } from "@nestjs/common";
import { UserService } from "@src/user/user.service";
import { LoginRequestDto, LoginResponseDto } from "@src/user/dto/login.dto";
import { RefreshResponseDto } from "@src/user/dto/refresh.dto";
import { BaseResultDto } from "@src/global/dto/base-result.dto";
import { SetDeviceInfoRequestDto } from "@src/user/dto/set-fcm.dto";
import { UserInfoDto } from "@src/user/dto/user-info.dto";
import { PushSettingDto } from "@src/user/dto/push-setting.dto";
import { UserGuard } from "@src/auth/guard/user.guard";
import { GetUser } from "@src/global/decorator/get-user.decorator";
import { UserContext } from "@src/auth/user-context.entity";
import { Request, Response } from "express";

@Controller("/api/v1/user")
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post("/login")
  async login(
    @Body() req: LoginRequestDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<LoginResponseDto> {
    const { access_token, refresh_token } = await this.userService.login(req);

    // Set the refresh token as an HTTP-only cookie
    res.cookie("refresh_token", refresh_token, {
      httpOnly: true,
    });

    return {
      access_token,
    };
  }

  @Post("/refresh")
  async refresh(@Body() req: Request): Promise<RefreshResponseDto> {
    const refreshToken = req.cookies.refresh_token;
    return this.userService.refresh(refreshToken);
  }

  @Post("/device")
  @UseGuards(UserGuard)
  async setDeviceInfo(
    @Body() req: SetDeviceInfoRequestDto,
    @GetUser() userCtx: UserContext,
  ): Promise<BaseResultDto> {
    return this.userService.setDeviceInfo(req, userCtx);
  }

  @Get("/info")
  @UseGuards(UserGuard)
  async getUserInfo(@GetUser() userCtx: UserContext): Promise<UserInfoDto> {
    return this.userService.getUserInfo(userCtx);
  }

  @Post("/push")
  async setPushSettings(
    @Body() req: PushSettingDto,
    @GetUser() userCtx: UserContext,
  ): Promise<PushSettingDto> {
    return this.userService.setPushSettings(req, userCtx);
  }

  @Post("/withdraw")
  async withdraw(@GetUser() userCtx: UserContext): Promise<BaseResultDto> {
    return this.userService.withdraw(userCtx);
  }
}
