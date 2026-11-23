import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { ManagerGuard } from "@src/auth/guard/manager.guard";
import { AdminDashboardService } from "./admin-dashboard.service";
import { AdminDashboardStatusResponseDto } from "./dto/admin-dashboard-status.dto";
import {
  AdminDashboardStatsQueryDto,
  AdminDashboardStatsResponseDto,
} from "./dto/admin-dashboard-stats.dto";

@Controller("api/manager/v1/dashboard")
@UseGuards(ManagerGuard)
export class AdminDashboardController {
  constructor(private readonly adminDashboardService: AdminDashboardService) {}

  @Get("status")
  async getStatus(): Promise<AdminDashboardStatusResponseDto> {
    return this.adminDashboardService.getStatus();
  }

  @Get("websocket-status")
  getWebsocketStatus(): AdminDashboardStatusResponseDto["websocket"] {
    return this.adminDashboardService.getWebsocketStatus();
  }

  @Get("stats")
  async getStats(
    @Query() query: AdminDashboardStatsQueryDto,
  ): Promise<AdminDashboardStatsResponseDto> {
    return this.adminDashboardService.getStats(query);
  }
}
