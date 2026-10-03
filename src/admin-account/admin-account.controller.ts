import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import { ManagerGuard } from "@src/auth/guard/manager.guard";
import { SuperAdminGuard } from "@src/auth/guard/super-admin.guard";
import { AdminAccountService } from "@src/admin-account/admin-account.service";
import { AdminAccountDto } from "@src/admin-account/dto/admin-account.dto";
import { CreateAdminAccountRequestDto } from "@src/admin-account/dto/create-admin-account.dto";
import { UpdateAdminAccountRoleRequestDto } from "@src/admin-account/dto/update-admin-account-role.dto";
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
    @Param("pk", ParseUUIDPipe) pk: string,
    @Body() req: UpdateAdminAccountRoleRequestDto,
    @Req() request: { user: ManagerContext },
  ): Promise<AdminAccountDto> {
    return this.adminAccountService.updateRole(pk, req, request.user.email);
  }

  @Delete("/:pk")
  @UseGuards(SuperAdminGuard)
  async remove(
    @Param("pk", ParseUUIDPipe) pk: string,
    @Req() req: { user: ManagerContext },
  ): Promise<BaseResultDto> {
    await this.adminAccountService.remove(pk, req.user.email);
    return BaseResultDto.OK;
  }
}
