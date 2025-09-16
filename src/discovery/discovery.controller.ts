import { Controller, Get, Param } from "@nestjs/common";
import { PotGDiscoveryService } from "@src/discovery/discovery.service";
import { RouteDto } from "@src/discovery/dto/route.dto";
import { StopDto } from "@src/discovery/dto/stop.dto";
import { PaginationDto } from "@src/global/dto/pagination.dto";
import { PotDto } from "@src/discovery/dto/pot.dto";

@Controller("/api/v1/discovery")
export class DiscoveryController {
  constructor(private readonly discoveryService: PotGDiscoveryService) {}

  @Get("/list")
  async searchPotList(
    @Param("offset") offset: number,
    @Param("limit") limit: number,
    @Param("route_id") route_id?: string,
    @Param("starts_at") starts_at?: Date,
    @Param("ends_at") ends_at?: Date,
  ): Promise<PaginationDto<PotDto>> {
    return await this.discoveryService.searchPotList(
      offset,
      limit,
      route_id,
      starts_at,
      ends_at,
    );
  }

  @Get("/route")
  async getRoutes(): Promise<RouteDto[]> {
    return await this.discoveryService.getRoutes();
  }

  @Get("/stop")
  async getStops(): Promise<StopDto[]> {
    return this.discoveryService.getStops();
  }
}
