import { Controller, Get, UseGuards } from "@nestjs/common";
import { ManagerGuard } from "@src/auth/guard/manager.guard";
import { AdminRouteService } from "@src/admin-route/admin-route.service";
import { AdminRouteDto } from "@src/admin-route/dto/admin-route.dto";
import { AdminStopDto } from "@src/admin-route/dto/admin-stop.dto";

@Controller("/api/manager/v1/route")
@UseGuards(ManagerGuard)
export class AdminRouteController {
  constructor(private readonly adminRouteService: AdminRouteService) {}

  @Get()
  async listRoutes(): Promise<AdminRouteDto[]> {
    return this.adminRouteService.listRoutes();
  }

  @Get("/stop")
  async listStops(): Promise<AdminStopDto[]> {
    return this.adminRouteService.listStops();
  }
}
