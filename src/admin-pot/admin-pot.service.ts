import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { subDays } from "date-fns";
import { PotRoomAdminRepository } from "@src/admin-database/repository/pot-room.admin.repository";
import { PotEventAdminRepository } from "@src/admin-database/repository/pot-event.admin.repository";
import { AdminChatViewLogRepository } from "@src/admin-database/repository/admin-chat-view-log.admin.repository";
import { ReportAdminRepository } from "@src/admin-database/repository/report.admin.repository";
import { RouteRepository } from "@src/database/repository/route.repository";
import { UserRepository } from "@src/database/repository/user.repository";
import { PotRoomAdminEntity } from "@src/admin-database/entity/pot-room.admin.entity";
import { PotEventReducer } from "@src/pot/event/pot-event-reducer";
import { Pot } from "@src/pot/model/pot";
import { PotService } from "@src/pot/pot.service";
import {
  AdminPotArchiveZeroTargetResDto,
  AdminPotDto,
  AdminPotStatus,
} from "@src/admin-pot/dto/admin-pot.dto";
import {
  AdminPotListReqDto,
  AdminPotListResDto,
  AdminPotSearchReqDto,
} from "@src/admin-pot/dto/admin-pot-search.dto";
import {
  AdminPotAccountingDto,
  AdminPotChatDto,
  AdminPotDetailDto,
} from "@src/admin-pot/dto/admin-pot-detail.dto";
import { Trace } from "@gsainfoteam/nest-observability";
import { BaseResultDto } from "@src/global/dto/base-result.dto";

const UUID_PATTERN =
  /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;

@Trace()
@Injectable()
export class AdminPotService {
  constructor(
    private readonly potRoomAdminRepository: PotRoomAdminRepository,
    private readonly potEventAdminRepository: PotEventAdminRepository,
    private readonly reportAdminRepository: ReportAdminRepository,
    private readonly adminChatViewLogRepository: AdminChatViewLogRepository,
    private readonly routeRepository: RouteRepository,
    private readonly userRepository: UserRepository,
    private readonly potService: PotService,
  ) {}

  async listAll(req: AdminPotListReqDto): Promise<AdminPotListResDto> {
    return this.listPage(req, false);
  }

  // 해산(아카이브)되지 않은 모든 팟을 조회합니다.
  async listActive(req: AdminPotListReqDto): Promise<AdminPotListResDto> {
    return this.listPage(req, true);
  }

  private async listPage(
    req: AdminPotListReqDto,
    activeOnly: boolean,
  ): Promise<AdminPotListResDto> {
    const [potRooms, total] = await Promise.all([
      this.potRoomAdminRepository.findAllWithDeparture({
        search: req.search,
        activeOnly,
        page: req.page,
        size: req.size,
      }),
      this.potRoomAdminRepository.countForAdmin({
        search: req.search,
        activeOnly,
      }),
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
    const potRooms = await this.potRoomAdminRepository.findAllWithDeparture({
      search: req.search,
      overdueBefore: subDays(new Date(), 1),
    });
    return this.toDtos(potRooms);
  }

  async getDetail(potPk: string): Promise<AdminPotDetailDto> {
    const potRoom = await this.potRoomAdminRepository.findByPk(potPk);
    if (!potRoom) {
      throw new NotFoundException("Pot not found.");
    }

    const events =
      await this.potEventAdminRepository.findEventsWithoutChat(potPk);
    const pot = PotEventReducer.reduceFromInitial(events);

    const eventDtos = events.map((event) => ({
      id: event.id!,
      timestamp: event.timestamp,
      event_type: event.eventType,
      data: event.toDto(),
    }));

    const routes = await this.routeRepository.findAllWithStops();
    const users = await this.getUserNames(pot, eventDtos, potPk);
    const isReported =
      await this.reportAdminRepository.existsByPotRoomPk(potPk);

    return {
      pk: potRoom.pk,
      name: potRoom.name,
      route_name: this.routeName(routes, potRoom.routeFk),
      status: this.resolveStatus(potRoom, pot),
      is_archived: potRoom.isArchived,
      is_deleted: potRoom.isDeleted,
      is_reported: isReported,
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

  // 개인정보 보호를 위해 신고가 접수된 팟의 채팅만 열람할 수 있습니다.
  async getChat(potPk: string, adminEmail: string): Promise<AdminPotChatDto> {
    const potRoom = await this.potRoomAdminRepository.findByPk(potPk);
    if (!potRoom) {
      throw new NotFoundException("Pot not found.");
    }

    if (!(await this.reportAdminRepository.existsByPotRoomPk(potPk))) {
      throw new ForbiddenException("Chat is only viewable for reported pots.");
    }

    await this.adminChatViewLogRepository.insert(potPk, adminEmail);

    const events = await this.potEventAdminRepository.findChatEvents(potPk);
    const messages = events.map((event) => ({
      id: event.id!,
      timestamp: event.timestamp,
      user_pk: event.data.userPk as string,
      message: event.data.message as string,
    }));

    const userPks = [...new Set(messages.map((message) => message.user_pk))];
    const profiles =
      userPks.length === 0
        ? []
        : await this.userRepository.getUserProfileByPks(userPks);

    return {
      pot_pk: potPk,
      users: Object.fromEntries(
        profiles.map((profile) => [
          profile.pk,
          profile.isDeleted ? `${profile.name} (withdrawn)` : profile.name,
        ]),
      ),
      messages,
    };
  }

  private async toDtos(potRooms: PotRoomAdminEntity[]): Promise<AdminPotDto[]> {
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
  private resolveListStatus(potRoom: PotRoomAdminEntity): AdminPotStatus {
    if (potRoom.isDeleted) return "DELETED";
    if (potRoom.isArchived) return "ARCHIVED";
    if (potRoom.isDepartureConfirmed) return "CONFIRMED";
    return "BEFORE_CONFIRMED";
  }

  private resolveStatus(potRoom: PotRoomAdminEntity, pot: Pot): AdminPotStatus {
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

  async archiveZeroTargetAccountingPots(): Promise<AdminPotArchiveZeroTargetResDto> {
    const activePotRooms =
      await this.potRoomAdminRepository.findAllWithDeparture({
        activeOnly: true,
      });

    const archivedPotPks: string[] = [];

    for (const potRoom of activePotRooms) {
      if (potRoom.isArchived || potRoom.isDeleted) continue;

      const events = await this.potEventAdminRepository.findEventsWithoutChat(
        potRoom.pk,
      );
      if (events.length === 0) continue;

      const pot = PotEventReducer.reduceFromInitial(events);

      // AdminPotService.resolveStatus 기준 "ACCOUNTING_DONE" 이면서 미해산인 상태와 동일
      if (
        !pot.isArchived &&
        Boolean(pot.accountingRequestUserId) &&
        Array.isArray(pot.accountingRequestedUserPks) &&
        pot.accountingRequestedUserPks.length === 0
      ) {
        /*
        [AccountingService.processConfirmAccounting을 실행하지 않고 archivePot을 바로 호출하는 이유]
        1. 대상 팟들은 정산 대상자가 0명이므로, 추가로 정산 상태를 변경할 유저가 없습니다.
        2. 해당 기능은 원래라면 해산되어야 했을 팟을 해산시키는 기능이므로, 추가적인 popo message 발송 불필요합니다.
        3. potService.archivePot(pot)에 팟 해산에 필수적인 로직이 들어있으므로 해당 코드만 실행합니다.
        */
        const res = await this.potService.archivePot(pot);
        if (res === BaseResultDto.OK) {
          archivedPotPks.push(pot.pk);
        }
      }
    }

    return {
      archived_count: archivedPotPks.length,
      archived_pot_pks: archivedPotPks,
    };
  }
}
