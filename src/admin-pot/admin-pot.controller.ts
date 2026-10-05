import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ManagerGuard } from "@src/auth/guard/manager.guard";
import { AdminPotService } from "@src/admin-pot/admin-pot.service";
import {
  AdminPotListReqDto,
  AdminPotListResDto,
  AdminPotSearchReqDto,
} from "@src/admin-pot/dto/admin-pot-search.dto";
import { AdminPotDto } from "@src/admin-pot/dto/admin-pot.dto";
import { AdminPotDetailDto } from "@src/admin-pot/dto/admin-pot-detail.dto";

@Controller("/api/manager/v1/pot")
@UseGuards(ManagerGuard)
export class AdminPotController {
  constructor(private readonly adminPotService: AdminPotService) {}

  @Get()
  async listAll(@Query() req: AdminPotListReqDto): Promise<AdminPotListResDto> {
    return this.adminPotService.listAll(req);
  }

  @Get("/active")
  async listActive(
    @Query() req: AdminPotListReqDto,
  ): Promise<AdminPotListResDto> {
    return this.adminPotService.listActive(req);
  }

  @Get("/overdue")
  async listOverdue(
    @Query() req: AdminPotSearchReqDto,
  ): Promise<AdminPotDto[]> {
    return this.adminPotService.listOverdue(req);
  }

  @Get("/:pk")
  async getDetail(
    @Param("pk", ParseUUIDPipe) pk: string,
  ): Promise<AdminPotDetailDto> {
    return this.adminPotService.getDetail(pk);
  }
}
