import { Injectable, NotFoundException } from "@nestjs/common";
import { subDays } from "date-fns";
import { PotRoomRepository } from "@src/database/repository/pot-room.repository";
import { PotEventRepository } from "@src/database/repository/pot-event.repository";
import { RouteRepository } from "@src/database/repository/route.repository";
import { UserRepository } from "@src/database/repository/user.repository";
import { PotRoomEntity } from "@src/database/entity/pot-room.entity";
import { PotEventReducer } from "@src/pot/event/pot-event-reducer";
import { Pot } from "@src/pot/model/pot";
import { AdminPotDto, AdminPotStatus } from "@src/admin-pot/dto/admin-pot.dto";
import {
  AdminPotListReqDto,
  AdminPotListResDto,
  AdminPotSearchReqDto,
} from "@src/admin-pot/dto/admin-pot-search.dto";
import {
  AdminPotAccountingDto,
  AdminPotDetailDto,
} from "@src/admin-pot/dto/admin-pot-detail.dto";

const UUID_PATTERN =
  /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;

@Injectable()
export class AdminPotService {
  constructor(
    private readonly potRoomRepository: PotRoomRepository,
    private readonly potEventRepository: PotEventRepository,
    private readonly routeRepository: RouteRepository,
    private readonly userRepository: UserRepository,
  ) {}

  async listAll(req: AdminPotListReqDto): Promise<AdminPotListResDto> {
    const [potRooms, total] = await Promise.all([
      this.potRoomRepository.findAllWithDeparture({
        search: req.search,
        page: req.page,
        size: req.size,
      }),
      this.potRoomRepository.countForAdmin(req.search),
    ]);

    return {
      items: await this.toDtos(potRooms),
      total,
      page: req.page,
      size: req.size,
    };
  }

  /**
   * 예정 출발 시간(확정된 출발 시간, 없으면 출발 가능 종료 시간)으로부터
   * 하루가 지났는데도 해산(아카이브)되지 않은 팟을 조회합니다.
   */
  async listOverdue(req: AdminPotSearchReqDto): Promise<AdminPotDto[]> {
    const potRooms = await this.potRoomRepository.findAllWithDeparture({
      search: req.search,
      overdueBefore: subDays(new Date(), 1),
    });
    return this.toDtos(potRooms);
  }

  async getDetail(potPk: string): Promise<AdminPotDetailDto> {
    const potRoom = await this.potRoomRepository.findByPk(potPk);
    if (!potRoom) {
      throw new NotFoundException("Pot not found.");
    }

    const events = await this.potEventRepository.findEventsWithoutChat(potPk);
    const pot = PotEventReducer.reduceFromInitial(events);

    const eventDtos = events.map((event) => ({
      id: event.id!,
      timestamp: event.timestamp,
      event_type: event.eventType,
      data: event.toDto(),
    }));

    const routes = await this.routeRepository.findAllWithStops();
    const users = await this.getUserNames(pot, eventDtos, potPk);

    return {
      pk: potRoom.pk,
      name: potRoom.name,
      route_name: this.routeName(routes, potRoom.routeFk),
      status: this.resolveStatus(potRoom, pot),
      is_archived: potRoom.isArchived,
      is_deleted: potRoom.isDeleted,
      total: potRoom.maxCapacity,
      starts_at: potRoom.startsAt,
      ends_at: potRoom.endsAt,
      departure_time: pot.departureTime,
      created_at: potRoom.createdAt,
      updated_at: potRoom.updatedAt,
      host_user_pk: pot.hostUserPk ?? null,
      joined_user_pks: pot.joinedUserPks,
      accounting: this.toAccountingDto(pot),
      users,
      events: eventDtos,
    };
  }

  private async toDtos(potRooms: PotRoomEntity[]): Promise<AdminPotDto[]> {
    const routes = await this.routeRepository.findAllWithStops();

    return potRooms.map((potRoom) => ({
      pk: potRoom.pk,
      name: potRoom.name,
      route_name: this.routeName(routes, potRoom.routeFk),
      status: this.resolveListStatus(potRoom),
      current: potRoom.currentUserCount ?? 0,
      total: potRoom.maxCapacity,
      starts_at: potRoom.startsAt,
      ends_at: potRoom.endsAt,
      departure_time: potRoom.departureTime ?? null,
      created_at: potRoom.createdAt,
    }));
  }

  private routeName(
    routes: { pk?: string; shortNameKor: string }[],
    routePk: string,
  ): string {
    return routes.find((route) => route.pk === routePk)?.shortNameKor ?? "-";
  }

  // 목록에서는 이벤트를 reduce 하지 않으므로 pot_room 컬럼만으로 판단합니다.
  private resolveListStatus(potRoom: PotRoomEntity): AdminPotStatus {
    if (potRoom.isDeleted) return "DELETED";
    if (potRoom.isArchived) return "ARCHIVED";
    if (potRoom.isDepartureConfirmed) return "CONFIRMED";
    return "BEFORE_CONFIRMED";
  }

  private resolveStatus(potRoom: PotRoomEntity, pot: Pot): AdminPotStatus {
    if (potRoom.isDeleted) return "DELETED";
    if (pot.isArchived || potRoom.isArchived) return "ARCHIVED";
    if (!pot.departureTime) return "BEFORE_CONFIRMED";
    if (pot.departureTime > new Date()) return "CONFIRMED";
    if (!pot.accountingRequestUserId) return "DEPARTED";
    if (pot.accountingRequestedUserPks.length > 0) return "WAIT_ACCOUNTING";
    return "ACCOUNTING_DONE";
  }

  private toAccountingDto(pot: Pot): AdminPotAccountingDto | null {
    if (!pot.accountingRequestUserId) return null;

    return {
      requested_by_user_pk: pot.accountingRequestUserId,
      total_cost: pot.totalCost,
      cost_per_user: pot.costPerUser,
      bank_name: pot.bankName,
      pending_user_pks: pot.accountingRequestedUserPks,
      confirmed_user_pks: pot.accountingConfirmedUserPks,
    };
  }

  // 이벤트 데이터 형태가 제각각이라, 현재 상태와 이벤트에 등장하는 모든 UUID 를 이름으로 풀어줍니다.
  private async getUserNames(
    pot: Pot,
    events: unknown[],
    potPk: string,
  ): Promise<Record<string, string>> {
    const found = new Set<string>(
      [
        pot.hostUserPk,
        pot.accountingRequestUserId,
        ...pot.joinedUserPks,
        ...pot.loggedUserPks,
        ...pot.accountingRequestedUserPks,
        ...pot.accountingConfirmedUserPks,
      ].filter((pk): pk is string => !!pk),
    );
    JSON.stringify(events)
      .match(UUID_PATTERN)
      ?.forEach((pk) => found.add(pk));
    found.delete(potPk);

    if (found.size === 0) return {};

    const profiles = await this.userRepository.getUserProfileByPks([...found]);
    return Object.fromEntries(
      profiles.map((profile) => [
        profile.pk,
        profile.isDeleted ? `${profile.name} (withdrawn)` : profile.name,
      ]),
    );
  }
}
