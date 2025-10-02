import { Injectable, OnModuleInit } from "@nestjs/common";
import { RouteRepository } from "@src/discovery/repository/route.repository";
import { StopsRepository } from "@src/discovery/repository/stops.repository";
import { StopsEntity } from "@src/discovery/model/stops.entity";
import { RouteEntity } from "@src/discovery/model/route.entity";
import { RouteDto } from "@src/discovery/dto/route.dto";
import { StopDto } from "@src/discovery/dto/stop.dto";

@Injectable()
export class RouteService implements OnModuleInit {
  private cachedStops: StopsEntity[] = [];
  private cachedRoutesWithStops: RouteEntity[] = [];

  constructor(
    private readonly routeRepository: RouteRepository,
    private readonly stopsRepository: StopsRepository,
  ) {}

  async onModuleInit(): Promise<any> {
    await this.cacheData();
  }

  async cacheData(): Promise<void> {
    this.cachedStops = await this.stopsRepository.findAll();
    this.cachedRoutesWithStops = await this.routeRepository.findAllWithStops();
  }

  getStops() {
    return this.cachedStops;
  }

  getRoutesWithStops() {
    return this.cachedRoutesWithStops;
  }

  getRouteById(routeId: string): RouteEntity | undefined {
    return this.cachedRoutesWithStops.find((route) => route.pk === routeId);
  }

  routeEntityToDto(route: RouteEntity): RouteDto {
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
  }

  stopEntityToDto(stops: StopsEntity): StopDto {
    return {
      id: stops.pk,
      name: stops.nameKor,
    };
  }
}
