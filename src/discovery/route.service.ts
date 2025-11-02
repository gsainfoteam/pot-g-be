import { Injectable, OnModuleInit } from "@nestjs/common";
import { RouteRepository } from "@src/database/repository/route.repository";
import { StopsRepository } from "@src/database/repository/stops.repository";
import { StopsEntity } from "@src/database/entity/stops.entity";
import { RouteEntity } from "@src/database/entity/route.entity";
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
      from: this.stopEntityToDto(route.fromStop),
      to: this.stopEntityToDto(route.toStop),
    };
  }

  stopEntityToDto(stops: StopsEntity): StopDto {
    return {
      id: stops.pk,
      name: stops.nameKor,
      lat: stops.lat,
      lng: stops.lng,
    };
  }
}
