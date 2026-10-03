import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  UseGuards,
} from "@nestjs/common";
import { ManagerGuard } from "@src/auth/guard/manager.guard";
import { AdminPotService } from "@src/admin-pot/admin-pot.service";
import { AdminPotDto } from "@src/admin-pot/dto/admin-pot.dto";
import { AdminPotDetailDto } from "@src/admin-pot/dto/admin-pot-detail.dto";

@Controller("/api/manager/v1/pot")
@UseGuards(ManagerGuard)
export class AdminPotController {
  constructor(private readonly adminPotService: AdminPotService) {}

  @Get()
  async listAll(): Promise<AdminPotDto[]> {
    return this.adminPotService.listAll();
  }

  @Get("/overdue")
  async listOverdue(): Promise<AdminPotDto[]> {
    return this.adminPotService.listOverdue();
  }

  @Get("/:pk")
  async getDetail(
    @Param("pk", ParseUUIDPipe) pk: string,
  ): Promise<AdminPotDetailDto> {
    return this.adminPotService.getDetail(pk);
  }
}
