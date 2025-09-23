import { Injectable } from "@nestjs/common";
import { RouteService } from "@src/discovery/route.service";
import { RouteDto } from "@src/discovery/dto/route.dto";
import { StopDto } from "@src/discovery/dto/stop.dto";
import { PaginationDto } from "@src/global/dto/pagination.dto";
import { PotDto } from "@src/discovery/dto/pot.dto";
import { PotSearchDto } from "@src/discovery/dto/pot-search.dto";
import { PotRoomRepository } from "@src/discovery/repository/pot-room.repository";
import { PotRoomEntity } from "@src/discovery/model/pot-room.entity";
import { RouteEntity } from "@src/discovery/model/route.entity";
import { StopsEntity } from "@src/discovery/model/stops.entity";

@Injectable()
export class PotGDiscoveryService {
  constructor(
    private readonly routeService: RouteService,
    private readonly potRoomRepository: PotRoomRepository,
  ) {}

  async searchPotList(req: PotSearchDto): Promise<PaginationDto<PotDto>> {
    const potRooms: PotRoomEntity[] =
      await this.potRoomRepository.searchPotList(
        req.offset,
        req.limit,
        req.route_id,
        req.starts_at,
        req.ends_at,
      );

    // 위 searchPotList 쿼리와 동시에 처리할 수 있지만 우선은 간단히 구현
    const total: number = await this.potRoomRepository.countPotList(
      req.route_id,
      req.starts_at,
      req.ends_at,
    );

    const potList: PotDto[] = potRooms.map(this.potRoomEntityToDto.bind(this));

    return {
      total: total,
      offset: req.offset,
      limit: req.limit,
      list: potList,
    };
  }

  async getRoutes(): Promise<RouteDto[]> {
    return this.routeService
      .getRoutesWithStops()
      .map(this.routeEntityToDto.bind(this));
  }

  async getStops(): Promise<StopDto[]> {
    return this.routeService.getStops().map(this.stopEntityToDto.bind(this));
  }

  private potRoomEntityToDto(potRoom: PotRoomEntity): PotDto {
    const route = this.routeService.getRouteById(potRoom.routeFk);

    return {
      id: potRoom.pk,
      name: potRoom.name,
      route: this.routeEntityToDto(route),
      starts_at: potRoom.startsAt,
      ends_at: potRoom.endsAt,
      current: potRoom.currentUserCount || 1,
      total: potRoom.maxCapacity,
    };
  }

  private routeEntityToDto(route: RouteEntity): RouteDto {
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

  private stopEntityToDto(stops: StopsEntity): StopDto {
    return {
      id: stops.pk,
      name: stops.nameKor,
    };
  }
}
