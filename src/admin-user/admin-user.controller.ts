import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Query,
  UseGuards,
} from "@nestjs/common";
import { AdminUserDetailDto } from "./dto/admin-user-detail.dto";
import {
  AdminUserPotListReqDto,
  AdminUserPotListResDto,
} from "./dto/admin-user-pot-list.dto";
import { ManagerGuard } from "@src/auth/guard/manager.guard";
import { AdminUserService } from "./admin-user.service";
import {
  AdminUserListReqDto,
  AdminUserListResDto,
} from "./dto/admin-user-list.dto";

@Controller("/api/manager/v1/user")
@UseGuards(ManagerGuard)
export class AdminUserController {
  constructor(private readonly adminUserService: AdminUserService) {}

  @Get("/:pk/pots")
  async listPots(
    @Param("pk", ParseUUIDPipe) pk: string,
    @Query() req: AdminUserPotListReqDto,
  ): Promise<AdminUserPotListResDto> {
    return this.adminUserService.listPots(pk, req);
  }

  @Get("/:pk")
  async getDetail(
    @Param("pk", ParseUUIDPipe) pk: string,
  ): Promise<AdminUserDetailDto> {
    return this.adminUserService.getDetail(pk);
  }

  @Get()
  async list(@Query() req: AdminUserListReqDto): Promise<AdminUserListResDto> {
    return this.adminUserService.list(req);
  }
}
