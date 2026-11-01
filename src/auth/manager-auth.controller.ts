import { Controller, Get, UseGuards } from "@nestjs/common";
import { ManagerMeResponseDto } from "@src/auth/dto/manager-login.dto";
import { ManagerGuard } from "@src/auth/guard/manager.guard";
import { GetManager } from "@src/global/decorator/get-manager.decorator";
import { ManagerContext } from "@src/auth/context/manager-context.entity";

@Controller("/api/manager/v1/auth")
export class ManagerAuthController {
  // 현재 로그인한 매니저의 계정 정보 (role 은 DB 의 현재 값입니다)
  @Get("/me")
  @UseGuards(ManagerGuard)
  me(@GetManager() managerCtx: ManagerContext): ManagerMeResponseDto {
    return { email: managerCtx.email, role: managerCtx.role };
  }
}
