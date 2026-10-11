import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import { ManagerGuard } from "@src/auth/guard/manager.guard";
import { SuperAdminGuard } from "@src/auth/guard/super-admin.guard";
import { AdminAccountService } from "@src/admin-account/admin-account.service";
import { AdminAccountDto } from "@src/admin-account/dto/admin-account.dto";
import { CreateAdminAccountRequestDto } from "@src/admin-account/dto/create-admin-account.dto";
import { UpdateAdminAccountRoleRequestDto } from "@src/admin-account/dto/update-admin-account-role.dto";
import { GetManager } from "@src/global/decorator/get-manager.decorator";
import { ManagerContext } from "@src/auth/context/manager-context.entity";
import { BaseResultDto } from "@src/global/dto/base-result.dto";

@Controller("/api/manager/v1/admin-account")
@UseGuards(ManagerGuard)
export class AdminAccountController {
  constructor(private readonly adminAccountService: AdminAccountService) {}

  @Get()
  async list(): Promise<AdminAccountDto[]> {
    return this.adminAccountService.list();
  }

  @Post()
  @UseGuards(SuperAdminGuard)
  async create(
    @Body() req: CreateAdminAccountRequestDto,
  ): Promise<AdminAccountDto> {
    return this.adminAccountService.create(req);
  }

  @Patch("/:pk")
  @UseGuards(SuperAdminGuard)
  async updateRole(
    @Param("pk", ParseUUIDPipe) adminPk: string,
    @Body() req: UpdateAdminAccountRoleRequestDto,
    @GetManager() managerCtx: ManagerContext,
  ): Promise<AdminAccountDto> {
    return this.adminAccountService.updateRole(adminPk, req, managerCtx);
  }

  @Delete("/:pk")
  @UseGuards(SuperAdminGuard)
  async remove(
    @Param("pk", ParseUUIDPipe) adminPk: string,
    @GetManager() managerCtx: ManagerContext,
  ): Promise<BaseResultDto> {
    await this.adminAccountService.remove(adminPk, managerCtx);
    return BaseResultDto.OK;
  }
}
