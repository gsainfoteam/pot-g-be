import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from "@nestjs/common";
import { ManagerGuard } from "@src/auth/guard/manager.guard";
import { SuperAdminGuard } from "@src/auth/guard/super-admin.guard";
import { AdminAccountService } from "@src/admin-account/admin-account.service";
import { AdminAccountDto } from "@src/admin-account/dto/admin-account.dto";
import { CreateAdminAccountRequestDto } from "@src/admin-account/dto/create-admin-account.dto";
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

  @Delete("/:pk")
  @UseGuards(SuperAdminGuard)
  async remove(@Param("pk") pk: string): Promise<BaseResultDto> {
    await this.adminAccountService.remove(pk);
    return BaseResultDto.OK;
  }
}
