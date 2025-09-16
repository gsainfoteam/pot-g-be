import { Injectable } from "@nestjs/common";
import { RouteService } from "@src/discovery/route.service";
import { RouteDto } from "@src/discovery/dto/route.dto";
import { StopDto } from "@src/discovery/dto/stop.dto";
import { PaginationDto } from "@src/global/dto/pagination.dto";
import { PotDto } from "@src/discovery/dto/pot.dto";

@Injectable()
export class PotGDiscoveryService {
  constructor(private readonly routeService: RouteService) {}

  async searchPotList(
    offset: number,
    limit: number,
    routeId?: string,
    startsAt?: Date,
    endsAt?: Date,
  ): Promise<PaginationDto<PotDto>> {
    return {
      total: 0,
      offset,
      limit,
      list: [],
    };
  }

  async getRoutes(): Promise<RouteDto[]> {
    return this.routeService.getRoutesWithStops().map((route) => {
      return {
        id: route.pk,
        from: {
          id: route.fromStopFk,
          name: route.fromStop.nameKor,
        },
        to: {
          id: route.toStopFk,
          name: route.toStop.nameKor,
        },
      };
    });
  }

  async getStops(): Promise<StopDto[]> {
    return this.routeService.getStops().map((stops) => {
      return {
        id: stops.pk,
        name: stops.nameKor,
      };
    });
  }
}
