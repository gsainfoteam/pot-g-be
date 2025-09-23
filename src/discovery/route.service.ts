import { Injectable, OnModuleInit } from "@nestjs/common";
import { RouteRepository } from "@src/discovery/repository/route.repository";
import { StopsRepository } from "@src/discovery/repository/stops.repository";
import { StopsEntity } from "@src/discovery/model/stops.entity";
import { RouteEntity } from "@src/discovery/model/route.entity";

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
}
