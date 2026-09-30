import { Injectable } from "@nestjs/common";
import { RouteRepository } from "@src/database/repository/route.repository";
import { StopsRepository } from "@src/database/repository/stops.repository";
import { RouteEntity } from "@src/database/entity/route.entity";
import { StopsEntity } from "@src/database/entity/stops.entity";
import { AdminRouteDto } from "@src/admin-route/dto/admin-route.dto";
import { AdminStopDto } from "@src/admin-route/dto/admin-stop.dto";

@Injectable()
export class AdminRouteService {
  constructor(
    private readonly routeRepository: RouteRepository,
    private readonly stopsRepository: StopsRepository,
  ) {}

  async listRoutes(): Promise<AdminRouteDto[]> {
    const routes = await this.routeRepository.findAllWithStops();
    return routes.map((route) => this.routeToDto(route));
  }

  async listStops(): Promise<AdminStopDto[]> {
    const stops = await this.stopsRepository.findAll();
    return stops.map((stop) => this.stopToDto(stop));
  }

  private routeToDto(route: RouteEntity): AdminRouteDto {
    return {
      pk: route.pk,
      short_name_kor: route.shortNameKor,
      short_name_eng: route.shortNameEng,
      from_stop: this.stopToDto(route.fromStop),
      to_stop: this.stopToDto(route.toStop),
    };
  }

  private stopToDto(stop: StopsEntity): AdminStopDto {
    return {
      pk: stop.pk,
      name_kor: stop.nameKor,
      name_eng: stop.nameEng,
      lat: stop.lat,
      lng: stop.lng,
    };
  }
}
