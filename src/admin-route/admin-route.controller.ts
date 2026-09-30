import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { ManagerGuard } from "@src/auth/guard/manager.guard";
import { AdminRouteService } from "@src/admin-route/admin-route.service";
import { AdminRouteDto } from "@src/admin-route/dto/admin-route.dto";
import { AdminStopDto } from "@src/admin-route/dto/admin-stop.dto";
import { CreateStopRequestDto } from "@src/admin-route/dto/create-stop.dto";
import { CreateRouteRequestDto } from "@src/admin-route/dto/create-route.dto";

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

  @Post()
  async createRoute(@Body() req: CreateRouteRequestDto): Promise<AdminRouteDto[]> {
    return this.adminRouteService.createRoute(req);
  }

  @Post("/stop")
  async createStop(@Body() req: CreateStopRequestDto): Promise<AdminStopDto> {
    return this.adminRouteService.createStop(req);
  }
}
