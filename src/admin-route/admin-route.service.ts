import { BadRequestException, Injectable } from "@nestjs/common";
import { DatabaseService } from "@src/database/database.service";
import { RouteRepository } from "@src/database/repository/route.repository";
import { StopsRepository } from "@src/database/repository/stops.repository";
import { RouteEntity } from "@src/database/entity/route.entity";
import { StopsEntity } from "@src/database/entity/stops.entity";
import { RouteService } from "@src/discovery/route.service";
import { AdminRouteDto } from "@src/admin-route/dto/admin-route.dto";
import { AdminStopDto } from "@src/admin-route/dto/admin-stop.dto";
import { CreateStopRequestDto } from "@src/admin-route/dto/create-stop.dto";
import { CreateRouteRequestDto } from "@src/admin-route/dto/create-route.dto";
import { UpdateStopNameRequestDto } from "@src/admin-route/dto/update-stop-name.dto";
import { UpdateRouteNameRequestDto } from "@src/admin-route/dto/update-route-name.dto";
import { TxType } from "@src/global/types/tx.types";

@Injectable()
export class AdminRouteService {
  constructor(
    private readonly dbService: DatabaseService,
    private readonly routeRepository: RouteRepository,
    private readonly stopsRepository: StopsRepository,
    private readonly discoveryRouteService: RouteService,
  ) {}

  async listRoutes(): Promise<AdminRouteDto[]> {
    const routes = await this.routeRepository.findAllWithStops();
    return routes.map((route) => this.routeToDto(route));
  }

  async listStops(): Promise<AdminStopDto[]> {
    const stops = await this.stopsRepository.findAll();
    return stops.map((stop) => this.stopToDto(stop));
  }

  async createStop(req: CreateStopRequestDto): Promise<AdminStopDto> {
    const inserted = await this.dbService.db.transaction(async (tx: TxType) => {
      return this.stopsRepository.insert(
        {
          nameKor: req.name_kor,
          nameEng: req.name_eng,
          lat: req.lat,
          lng: req.lng,
        },
        tx,
      );
    });
    await this.discoveryRouteService.cacheData();

    return this.stopToDto(inserted);
  }

  async createRoute(req: CreateRouteRequestDto): Promise<AdminRouteDto[]> {
    if (req.from_stop_pk === req.to_stop_pk) {
      throw new BadRequestException("출발/도착 정류장이 같을 수 없습니다.");
    }

    const [fromStop, toStop] = await Promise.all([
      this.stopsRepository.findByPk(req.from_stop_pk),
      this.stopsRepository.findByPk(req.to_stop_pk),
    ]);

    if (!fromStop) {
      throw new BadRequestException("출발 정류장을 찾을 수 없습니다.");
    }
    if (!toStop) {
      throw new BadRequestException("도착 정류장을 찾을 수 없습니다.");
    }

    const [forward, backward] = await this.dbService.db.transaction(
      async (tx: TxType) => {
        const forwardRoute = await this.routeRepository.insert(
          {
            fromStopFk: fromStop.pk,
            toStopFk: toStop.pk,
            shortNameKor: req.short_name_kor,
            shortNameEng: req.short_name_eng,
          },
          tx,
        );
        const backwardRoute = await this.routeRepository.insert(
          {
            fromStopFk: toStop.pk,
            toStopFk: fromStop.pk,
            shortNameKor: req.reverse_short_name_kor,
            shortNameEng: req.reverse_short_name_eng,
          },
          tx,
        );
        return [forwardRoute, backwardRoute];
      },
    );
    await this.discoveryRouteService.cacheData();

    return [
      {
        pk: forward.pk,
        short_name_kor: forward.shortNameKor,
        short_name_eng: forward.shortNameEng,
        from_stop: this.stopToDto(fromStop),
        to_stop: this.stopToDto(toStop),
      },
      {
        pk: backward.pk,
        short_name_kor: backward.shortNameKor,
        short_name_eng: backward.shortNameEng,
        from_stop: this.stopToDto(toStop),
        to_stop: this.stopToDto(fromStop),
      },
    ];
  }

  async updateStopName(
    pk: string,
    req: UpdateStopNameRequestDto,
  ): Promise<AdminStopDto> {
    const existing = await this.stopsRepository.findByPk(pk);
    if (!existing) {
      throw new BadRequestException("정류장을 찾을 수 없습니다.");
    }

    const updated = await this.dbService.db.transaction(async (tx: TxType) => {
      return this.stopsRepository.updateName(
        {
          pk,
          nameKor: req.name_kor,
          nameEng: req.name_eng,
          lat: existing.lat,
          lng: existing.lng,
        },
        tx,
      );
    });
    await this.discoveryRouteService.cacheData();

    return this.stopToDto(updated);
  }

  async updateRouteName(
    pk: string,
    req: UpdateRouteNameRequestDto,
  ): Promise<AdminRouteDto> {
    const existing = await this.routeRepository.findByPk(pk);
    if (!existing) {
      throw new BadRequestException("노선을 찾을 수 없습니다.");
    }

    const updated = await this.dbService.db.transaction(async (tx: TxType) => {
      return this.routeRepository.updateName(
        {
          pk,
          fromStopFk: existing.fromStopFk,
          toStopFk: existing.toStopFk,
          shortNameKor: req.short_name_kor,
          shortNameEng: req.short_name_eng,
        },
        tx,
      );
    });
    await this.discoveryRouteService.cacheData();

    return {
      pk: updated.pk,
      short_name_kor: updated.shortNameKor,
      short_name_eng: updated.shortNameEng,
      from_stop: this.stopToDto(existing.fromStop),
      to_stop: this.stopToDto(existing.toStop),
    };
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
