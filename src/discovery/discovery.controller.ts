import { Controller, Get, Query } from "@nestjs/common";
import { PotGDiscoveryService } from "@src/discovery/discovery.service";
import { RouteDto } from "@src/discovery/dto/route.dto";
import { StopDto } from "@src/discovery/dto/stop.dto";
import { PaginationDto } from "@src/global/dto/pagination.dto";
import { PotDto } from "@src/discovery/dto/pot.dto";
import { PotSearchDto } from "@src/discovery/dto/pot-search.dto";

@Controller("/api/v1/discovery")
export class DiscoveryController {
  constructor(private readonly discoveryService: PotGDiscoveryService) {}

  @Get("/list")
  async searchPotList(
    @Query() req: PotSearchDto,
  ): Promise<PaginationDto<PotDto>> {
    return await this.discoveryService.searchPotList(req);
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
