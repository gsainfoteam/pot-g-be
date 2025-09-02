import { Controller, Get } from "@nestjs/common";
import { PotGDiscoveryService } from "@src/discovery/discovery.service";
import { RouteDto } from "@src/discovery/dto/route.dto";
import { StopDto } from "@src/discovery/dto/stop.dto";

@Controller("/api/v1/discovery")
export class DiscoveryController {
  constructor(private readonly discoveryService: PotGDiscoveryService) {}

  @Get("/route")
  async getRoutes(): Promise<RouteDto[]> {
    return await this.discoveryService.getRoutes();
  }

  @Get("/stop")
  async getStops(): Promise<StopDto[]> {
    return this.discoveryService.getStops();
  }
}
