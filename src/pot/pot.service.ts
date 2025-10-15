import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { CreatePotReqDto, CreatePotResDto } from "@src/pot/dto/create.pot.dto";
import { UserContext } from "@src/auth/user-context.entity";
import { PotEventReducer } from "@src/pot/event/pot-event-reducer";
import { PotCreateEventV1 } from "@src/pot/event/v1/pot-create-event";
import { RouteService } from "@src/discovery/route.service";
import { DatabaseService } from "@src/database/database.service";
import { RouteEntity } from "@src/database/entity/route.entity";
import { randomUUID } from "node:crypto";
import { PotRoomEntity } from "@src/database/entity/pot-room.entity";
import { TxType } from "@src/global/types/tx.types";
import { PotEventRepository } from "@src/database/repository/pot-event.repository";
import { PotRoomRepository } from "@src/database/repository/pot-room.repository";
import { UserPotRoomEntity } from "@src/database/entity/user-pot-room.entity";
import { UserPotRoomRepository } from "@src/database/repository/user-pot-room.repository";
import { BaseResultDto } from "@src/global/dto/base-result.dto";
import { Pot } from "@src/pot/model/pot";
import { PotUserInEventV1 } from "@src/pot/event/v1/pot-user-in-event";
import { PotUserLeaveEventV1 } from "@src/pot/event/v1/pot-user-leave-event";
import { PotUserKickEventV1 } from "@src/pot/event/v1/pot-user-kick-event";
import { PotDepartureConfirmEventV1 } from "@src/pot/event/v1/pot-departure-confirm-event";
import { PotEventError } from "@src/global/exceptions/pot-event.error";
import { SendChatReqDto } from "@src/pot/dto/send-chat.pot.dto";
import { PotChatEventV1 } from "@src/pot/event/v1/pot-chat-event";
import { BroadcastingService } from "@src/broadcasting/broadcasting.service";
import { MyPotResDto } from "@src/pot/dto/my.pot.dto";
import {
  PotEventListReqDto,
  PotEventListResDto,
} from "@src/pot/dto/pot.event.dto";
import { PotDetailDto } from "@src/pot/dto/pot.detail.dto";
import { PotInfoDto } from "@src/pot/dto/pot.info.dto";
import { UserRepository } from "@src/database/repository/user.repository";
import {
  addHours,
  fromUnixTime,
  getUnixTime,
  subHours,
  subMinutes,
} from "date-fns";
import { PopoService } from "@src/popo/popo.service";
import { PotArchiveEventV1 } from "@src/pot/event/v1/pot-archive-event";
import { PotOverviewDto } from "@src/pot/dto/pot.overview.dto";
import { AccountingResultDto } from "@src/accounting/dto/confirm-accounting.dto";
import { toDateFormatWithTimezone } from "@src/global/utils/convertDate";

@Injectable()
export class PotService {
  constructor(
    private readonly dbService: DatabaseService,
    private readonly routeService: RouteService,
    private readonly broadcastingService: BroadcastingService,
    private readonly popoService: PopoService,
    private readonly potRoomRepository: PotRoomRepository,
    private readonly potEventRepository: PotEventRepository,
    private readonly userPotRoomRepository: UserPotRoomRepository,
    private readonly userRepository: UserRepository,
  ) {}

  async createPot(
    req: CreatePotReqDto,
    userCtx: UserContext,
  ): Promise<CreatePotResDto> {
    const route = this.routeService
      .getRoutesWithStops()
      .find((r) => r.pk === req.route_id);

    if (!route) {
      throw new BadRequestException("Route not found");
    }

    const potCreateEvent: PotCreateEventV1 = this.createPotCreateEvent(
      req,
      route,
      userCtx.userId,
    );

    const pot = PotEventReducer.reduceFromInitial([potCreateEvent], true);
    const potRoomEntity: PotRoomEntity = pot.toPotRoomEntity();

    // userPotRoom Entity 생성
    const userPotRoomEntity: UserPotRoomEntity = {
      potRoomFk: potRoomEntity.pk,
      userFk: userCtx.userId,
      isHost: true,
      isArchived: false,
    };

    await this.dbService.db.transaction(async (tx: TxType) => {
      await this.potRoomRepository.insert(potRoomEntity, tx);
      await this.potEventRepository.saveEvent(potCreateEvent, tx);
      await this.userPotRoomRepository.insert(userPotRoomEntity, tx);
    });

    const popoDepartureConfirmChatMsg = this.popoService.getPopoChatMsgByType(
      "popo-departure-confirm-request-v1",
    );

    if (subHours(req.starts_at, 6) > new Date()) {
      // starts_at 시간 6시간 전 메세지 발송 예약
      this.popoService.asyncReservePopoChatMsg(
        popoDepartureConfirmChatMsg,
        subHours(req.starts_at, 6),
        null,
        pot,
        {
          departureTimeEndsAt: pot.departureAvailableEndTime,
        },
      );
    }

    // ends_at 시간에 팟 자동 해산 예약
    const popoAutoArchiveChatMsg = this.popoService.getPopoChatMsgByType(
      "popo-auto-archive-no-departure-confirm-v1",
    );

    this.popoService.asyncReservePopoChatMsg(
      popoAutoArchiveChatMsg,
      req.ends_at,
      null,
      pot,
    );

    return {
      id: potRoomEntity.pk,
    };
  }

  async getMyPot(userCtx: UserContext): Promise<MyPotResDto> {
    const myPotRoomEntityList = await this.potRoomRepository.getUserPotRoomList(
      userCtx.userId,
      "chat_v1",
    );

    const myPotList: PotDetailDto[] = [];
    const myArchivedPotList: PotDetailDto[] = [];

    // separate archived and non-archived pots
    for (const potRoomEntity of myPotRoomEntityList) {
      if (potRoomEntity.isArchived) {
        myArchivedPotList.push(
          this.potRoomEntityToPotDetailDto(potRoomEntity, userCtx),
        );
      } else {
        myPotList.push(
          this.potRoomEntityToPotDetailDto(potRoomEntity, userCtx),
        );
      }
    }

    return {
      pot_list: myPotList,
      archived_pot_list: myArchivedPotList,
    };
  }

  private potRoomEntityToPotDetailDto(
    potRoomEntity: PotRoomEntity,
    userCtx: UserContext,
  ): PotDetailDto {
    const pot = potRoomEntity.pot;
    const route = this.routeService.getRouteById(potRoomEntity.routeFk);

    return {
      id: potRoomEntity.pk,
      name: potRoomEntity.name,
      route: this.routeService.routeEntityToDto(route),
      starts_at: toDateFormatWithTimezone(potRoomEntity.startsAt),
      ends_at: toDateFormatWithTimezone(potRoomEntity.endsAt),
      departure_time: potRoomEntity.isDepartureConfirmed
        ? toDateFormatWithTimezone(pot.departureTime)
        : undefined,
      current: pot.joinedUserPks.length,
      total: potRoomEntity.maxCapacity,
      status: pot.getStatus(userCtx.userId),
      accounting_requested: pot.totalCost,
    };
  }

  async getPotInfo(potPk: string, userCtx: UserContext): Promise<PotInfoDto> {
    const potRoomEntity = await this.potRoomRepository.getPotRoomInfoByPk(
      potPk,
      "chat_v1",
    );

    // 팟이 존재하는지 확인
    if (!potRoomEntity) {
      throw new BadRequestException("Pot not found");
    }

    // 유저가 팟에 참여하고 있는지 확인 필요
    if (!potRoomEntity.pot.joinedUserPks.includes(userCtx.userId)) {
      throw new ForbiddenException("User not in pot");
    }

    return await this.potRoomEntityToPotInfoDto(potRoomEntity, userCtx);
  }

  async getPotOverview(potPk: string): Promise<PotOverviewDto> {
    const potRoomEntity = await this.potRoomRepository.getPotRoomInfoByPk(
      potPk,
      "chat_v1",
    );

    // 팟이 존재하는지 확인
    if (!potRoomEntity) {
      throw new BadRequestException("Pot not found");
    }

    return await this.potRoomEntityToPotOverviewDto(potRoomEntity);
  }

  private async potRoomEntityToPotInfoDto(
    potRoomEntity: PotRoomEntity,
    userCtx: UserContext,
  ): Promise<PotInfoDto> {
    const pot = potRoomEntity.pot;

    const userProfiles = await this.userRepository.getUserProfileByPks(
      pot.loggedUserPks,
    );

    const route = this.routeService.getRouteById(potRoomEntity.routeFk);

    const accountingResults: AccountingResultDto[] = [
      ...pot.accountingRequestedUserPks.map((userPk) => {
        return {
          user_pk: userPk,
          accounting_done: false,
        };
      }),
      ...pot.accountingConfirmedUserPks.map((userPk) => {
        return {
          user_pk: userPk,
          accounting_done: true,
        };
      }),
    ];

    return {
      id: potRoomEntity.pk,
      name: potRoomEntity.name,
      route: this.routeService.routeEntityToDto(route),
      starts_at: toDateFormatWithTimezone(potRoomEntity.startsAt),
      ends_at: toDateFormatWithTimezone(potRoomEntity.endsAt),
      departure_time: potRoomEntity.isDepartureConfirmed
        ? toDateFormatWithTimezone(pot.departureTime)
        : undefined,
      status: pot.getStatus(userCtx.userId),
      users_info: {
        current: pot.joinedUserPks.length,
        total: potRoomEntity.maxCapacity,
        users: userProfiles.map((u) => {
          return {
            id: u.pk,
            name: u.name,
            is_host: pot.hostUserPk == u.pk,
            is_in_pot: pot.joinedUserPks.includes(u.pk),
          };
        }),
      },
      accounting_info: {
        requesting_user: pot.accountingRequestUserId || undefined,
        accounting_results: accountingResults,
        total_cost: pot.totalCost || undefined,
        cost_per_user: pot.costPerUser || undefined,
        bank_name: pot.bankName || undefined,
        bank_account: pot.bankAccount || undefined,
      },
    };
  }

  private async potRoomEntityToPotOverviewDto(
    potRoomEntity: PotRoomEntity,
  ): Promise<PotOverviewDto> {
    const pot = potRoomEntity.pot;

    const userProfiles = await this.userRepository.getUserProfileByPks(
      pot.loggedUserPks,
    );

    const route = this.routeService.getRouteById(potRoomEntity.routeFk);

    return {
      id: potRoomEntity.pk,
      name: potRoomEntity.name,
      route: this.routeService.routeEntityToDto(route),
      starts_at: toDateFormatWithTimezone(potRoomEntity.startsAt),
      ends_at: toDateFormatWithTimezone(potRoomEntity.endsAt),
      users_info: {
        current: pot.joinedUserPks.length,
        total: potRoomEntity.maxCapacity,
        users: userProfiles
          .filter((up) => pot.joinedUserPks.includes(up.pk))
          .map((u) => {
            return {
              id: u.pk,
              name: u.name,
              is_host: pot.hostUserPk == u.pk,
              is_in_pot: true,
            };
          }),
      },
    };
  }

  async getPotEvents(
    potPk: string,
    req: PotEventListReqDto,
    userCtx: UserContext,
  ): Promise<PotEventListResDto> {
    // 유저가 팟에 참여하고 있는지 확인
    if (
      !(await this.userPotRoomRepository.existsByPotRoomFkAndUserFk(
        potPk,
        userCtx.userId,
      ))
    ) {
      throw new ForbiddenException("User not in pot");
    }

    const potEvents = await this.potEventRepository.getEventsByPotPkWithLimit(
      potPk,
      fromUnixTime(req.starts_from),
      req.limit,
    );

    // 팟이 존재하는지 확인
    if (potEvents.length === 0) {
      return {
        events: [],
      };
    }

    // 클라이언트는 본인이 가지고 있는 가장 마지막 이벤트의 timestamp 를 starts_from 으로 주기 때문에
    // 쿼리 시에도 같은 timestamp 를 가진 이벤트가 포함되어 오게 됩니다.
    // 이 경우 중복된 이벤트가 반환되지 않도록 제거합니다.
    if (req.except && potEvents[0].id === req.except) {
      potEvents.shift();
    }

    return {
      // timestamp DESC 로 정렬되어서 오기 때문에 (가장 최신이 맨 위) 다시 순서를 뒤집습니다. (가장 오래된 것이 맨 위)
      events: potEvents.reverse().map((pe) => {
        return {
          pot_pk: pe.potRoomPk,
          timestamp: getUnixTime(pe.timestamp),
          id: pe.id,
          event_type: pe.eventType,
          data: pe.toDto(),
        };
      }),
    };
  }

  /*
    팟에 참여합니다.

    - 입장 불가능 이유
    - AfterDepartureConfirmed: 출발 시간이 확정된 경우
    - PotNotExist: potPK 가 존재하지 않는 팟인 경우
    - PotAlreadyClosed: 이미 해산된 팟인 경우
    - PotFull: 팟이 가득 찬 경우
   */
  async enterPot(potPk: string, userCtx: UserContext): Promise<BaseResultDto> {
    const pot = await this.getPot(potPk);
    if (!pot) {
      return BaseResultDto.PotNotExist;
    }

    // 이미 참여한 유저인 경우 참여 불가
    if (pot.joinedUserPks.includes(userCtx.userId)) {
      return BaseResultDto.OK;
    }

    const potUserInEvent: PotUserInEventV1 =
      PotUserInEventV1.generatePotUserInEvent(potPk, new Date(), {
        potRoomPk: potPk,
        userPk: userCtx.userId,
      });

    try {
      PotEventReducer.reduce(pot, potUserInEvent, true);
    } catch (error) {
      if (error instanceof PotEventError) {
        return error.baseResultDto;
      }
      throw error; // 알 수 없는 오류는 다시 던짐
    }

    // userPotRoom Entity 생성
    const userPotRoomEntity: UserPotRoomEntity = {
      potRoomFk: pot.pk,
      userFk: userCtx.userId,
      isHost: false,
      isArchived: false,
    };

    await this.dbService.db.transaction(async (tx: TxType) => {
      await this.potEventRepository.saveEvent(potUserInEvent, tx);
      await this.userPotRoomRepository.insert(userPotRoomEntity, tx);
    });

    this.broadcastingService.asyncBroadcastPotEvent(
      {
        pot_pk: pot.pk,
        timestamp: getUnixTime(potUserInEvent.timestamp),
        id: potUserInEvent.id,
        event_type: potUserInEvent.eventType,
        data: potUserInEvent.toDto(),
      },
      pot.joinedUserPks,
    );

    return BaseResultDto.OK;
  }

  /*
    팟에서 퇴장합니다.

    - 퇴장 불가능 이유
    - AfterDepartureConfirmed: 출발 시간이 확정된 경우
    - NotYetPaymentConfirmed: 본인이 정산 요청 대상자인데 본인의 정산이 확인되지 않은 경우
    - NotYetPaymentCompleted: 본인이 정산자인데 정산이 완료되지 않은 다른 사람이 있는 경우
    - UserNotInPot: 팟에 참여하지 않은 사용자인 경우
    - PotNotExist: potPK 가 존재하지 않는 팟인 경우
    - PotAlreadyClosed: 이미 해산된 팟인 경우
  */
  async leavePot(potPk: string, userCtx: UserContext): Promise<BaseResultDto> {
    const pot = await this.getPot(potPk);
    if (!pot) {
      return BaseResultDto.PotNotExist;
    }

    const previousHostUserPk = pot.hostUserPk;

    const potUserLeaveEvent: PotUserLeaveEventV1 =
      PotUserLeaveEventV1.generatePotUserLeaveEvent(potPk, new Date(), {
        potRoomPk: potPk,
        userPk: userCtx.userId,
      });

    try {
      PotEventReducer.reduce(pot, potUserLeaveEvent, true);
    } catch (error) {
      if (error instanceof PotEventError) {
        return error.baseResultDto;
      }
      throw error; // 알 수 없는 오류는 다시 던짐
    }

    await this.dbService.db.transaction(async (tx: TxType) => {
      await this.potEventRepository.saveEvent(potUserLeaveEvent, tx);
      await this.userPotRoomRepository.deleteByPotRoomFkAndUserFk(
        pot.pk,
        userCtx.userId,
        tx,
      );
      // 방장이 바뀐 경우 user_pot_room 테이블의 is_host 업데이트
      if (
        pot.joinedUserPks.length > 0 &&
        previousHostUserPk !== pot.hostUserPk
      ) {
        await this.userPotRoomRepository.updateHostStatus(
          pot.pk,
          previousHostUserPk,
          false,
          tx,
        );
        await this.userPotRoomRepository.updateHostStatus(
          pot.pk,
          pot.hostUserPk,
          true,
          tx,
        );
      }
    });

    this.broadcastingService.asyncBroadcastPotEvent(
      {
        pot_pk: pot.pk,
        timestamp: getUnixTime(potUserLeaveEvent.timestamp),
        id: potUserLeaveEvent.id,
        event_type: potUserLeaveEvent.eventType,
        data: potUserLeaveEvent.toDto(),
      },
      [...pot.joinedUserPks, userCtx.userId],
    );

    // 모든 참여자가 퇴장했다면 팟 해산 이벤트 전송
    if (pot.joinedUserPks.length === 0) {
      await this.archivePot(pot);
    }

    return BaseResultDto.OK;
  }

  /*
    팟의 방장이 채팅방 내 사용자를 강퇴시킵니다.

    - 강퇴 불가능 이유
    - NotAHost: 해당 채팅방의 방장이 아닌 경우
    - UserNotInPot: 해당 채팅방에 없는 사용자인 경우
    - CannotKickSelf: 본인이 본인을 강퇴하려고 하는 경우
    - AfterDepartureConfirmed: 출발 시간이 확정된 경우
    - NotYetPaymentConfirmed: 강퇴 시키려는 사용자에게 정산 요청이 되었지만 정산이 확인되지 않은 경우
    - PotNotExist: potPK 가 존재하지 않는 팟인 경우
    - PotAlreadyClosed: 이미 해산된 팟인 경우
  */
  async kickUserFromPot(
    potPk: string,
    targetUserId: string,
    userCtx: UserContext,
  ): Promise<BaseResultDto> {
    const pot = await this.getPot(potPk);
    if (!pot) {
      return BaseResultDto.PotNotExist;
    }

    const potUserKickEvent: PotUserKickEventV1 =
      PotUserKickEventV1.generatePotUserKickEvent(potPk, new Date(), {
        potRoomPk: potPk,
        userPk: userCtx.userId,
        kickedUserPk: targetUserId,
      });

    try {
      PotEventReducer.reduce(pot, potUserKickEvent, true);
    } catch (error) {
      if (error instanceof PotEventError) {
        return error.baseResultDto;
      }
      throw error; // 알 수 없는 오류는 다시 던짐
    }

    await this.dbService.db.transaction(async (tx: TxType) => {
      await this.potEventRepository.saveEvent(potUserKickEvent, tx);
      await this.userPotRoomRepository.deleteByPotRoomFkAndUserFk(
        pot.pk,
        targetUserId,
        tx,
      );
    });

    this.broadcastingService.asyncBroadcastPotEvent(
      {
        pot_pk: pot.pk,
        timestamp: getUnixTime(potUserKickEvent.timestamp),
        id: potUserKickEvent.id,
        event_type: potUserKickEvent.eventType,
        data: potUserKickEvent.toDto(),
      },
      [...pot.joinedUserPks, targetUserId],
    );

    return BaseResultDto.OK;
  }

  /*
    팟의 출발 시간을 확정 or 수정합니다. 이는 팟의 방장만 가능합니다.

    - 시간 확정 불가능 이유
    - NotAHost: 해당 채팅방의 방장이 아닌 경우
    - AfterDeparture: 확정된 출발 시간이 지난 경우 (택시 탑승이 이루어진 이후)
    - BeforeNow: 현재 시간보다 이른 시간으로 시간을 확정하는 경우
    - NotInAvailableTimeRange: 출발 가능 시작 시간과 출발 가능 종료 시간 사이가 아닌 시간으로 시간을 확정하는 경우
    - PotNotExist: potPK 가 존재하지 않는 팟인 경우
    - PotAlreadyClosed: 이미 해산된 팟인 경우
  */
  async confirmDepartureTime(
    potPk: string,
    departureTime: Date,
    userCtx: UserContext,
  ): Promise<BaseResultDto> {
    const pot = await this.getPot(potPk);
    if (!pot) {
      return BaseResultDto.PotNotExist;
    }

    const potDepartureConfirmEvent: PotDepartureConfirmEventV1 =
      PotDepartureConfirmEventV1.generatePotDepartureConfirmEvent(
        potPk,
        new Date(),
        {
          potRoomPk: potPk,
          userPk: userCtx.userId,
          departureTime: departureTime,
        },
      );

    try {
      PotEventReducer.reduce(pot, potDepartureConfirmEvent, true);
    } catch (error) {
      if (error instanceof PotEventError) {
        return error.baseResultDto;
      }
      throw error; // 알 수 없는 오류는 다시 던짐
    }

    await this.dbService.db.transaction(async (tx: TxType) => {
      await this.potRoomRepository.setDepartureTime(pot.pk, tx);
      await this.potEventRepository.saveEvent(potDepartureConfirmEvent, tx);
    });

    this.broadcastingService.asyncBroadcastPotEvent(
      {
        pot_pk: pot.pk,
        timestamp: getUnixTime(potDepartureConfirmEvent.timestamp),
        id: potDepartureConfirmEvent.id,
        event_type: potDepartureConfirmEvent.eventType,
        data: potDepartureConfirmEvent.toDto(),
      },
      pot.joinedUserPks,
    );

    const departureConfirmedPopoChatMsg = this.popoService.getPopoChatMsgByType(
      "popo-departure-confirmed-v1",
    );

    // 출발 시간 확정 안내 메세지 즉시 발송
    this.popoService.asyncSendPopoChatMsgToPotRoom(
      departureConfirmedPopoChatMsg,
      null,
      pot,
      {
        departureTimeEndsAt: pot.departureAvailableEndTime,
      },
    );

    // 출발 시간 확정 요청 메세지 삭제
    this.popoService.asyncDeletePopoChatReservation(
      "popo-departure-confirm-request-v1",
      pot.pk,
    );

    // 팟 자동 해산 메세지 삭제
    this.popoService.asyncDeletePopoChatReservation(
      "popo-auto-archive-no-departure-confirm-v1",
      pot.pk,
    );

    const taxiCallPopoChatMsg = this.popoService.getPopoChatMsgByType(
      "popo-reminder-taxi-call-v1",
    );

    // 출발 확정을 20분 안으로 했을 경우 바로 발송
    if (subMinutes(departureTime, 20) < new Date()) {
      this.popoService.asyncSendPopoChatMsgToPotRoom(
        taxiCallPopoChatMsg,
        null,
        pot,
        {
          remainDepartureTime: Math.floor(
            (departureTime.getTime() - new Date().getTime()) / 60000,
          ),
        },
      );
    } else {
      // departureTime 시간 20분 전 taxi call reminder 메세지 발송 예약
      this.popoService.asyncReservePopoChatMsg(
        taxiCallPopoChatMsg,
        subMinutes(departureTime, 20),
        null,
        pot,
        {
          remainDepartureTime: 20,
        },
      );
    }

    const accountingPopoChatMsg = this.popoService.getPopoChatMsgByType(
      "popo-accounting-reminder-v1",
    );

    // departureTime 시간 2시간 후 accounting reminder 메세지 발송 예약
    this.popoService.asyncReservePopoChatMsg(
      accountingPopoChatMsg,
      addHours(departureTime, 2),
      null,
      pot,
    );

    return BaseResultDto.OK;
  }

  async saveChat(
    req: SendChatReqDto,
    senderUserPk: string,
    senderUserName: string,
  ): Promise<BaseResultDto> {
    const pot = await this.getPot(req.potRoomPk);
    if (!pot) {
      return BaseResultDto.PotNotExist;
    }

    const now = new Date();

    const potChatEvent: PotChatEventV1 = PotChatEventV1.generatePotChatEvent(
      req.potRoomPk,
      now,
      {
        potRoomPk: req.potRoomPk,
        userPk: senderUserPk,
        message: req.message,
        timestamp: now,
      },
    );

    try {
      PotEventReducer.reduce(pot, potChatEvent, true);
    } catch (error) {
      if (error instanceof PotEventError) {
        return error.baseResultDto;
      }
      throw error;
    }

    await this.dbService.db.transaction(async (tx: TxType) => {
      await this.potEventRepository.saveEvent(potChatEvent, tx);
    });

    this.broadcastingService.asyncBroadcastPotEvent(
      {
        pot_pk: pot.pk,
        timestamp: getUnixTime(potChatEvent.timestamp),
        id: potChatEvent.id,
        event_type: potChatEvent.eventType,
        data: potChatEvent.toDto(),
      },
      pot.joinedUserPks,
      pot.name,
      senderUserName,
    );

    return BaseResultDto.OK;
  }

  async archivePot(pot: Pot): Promise<BaseResultDto> {
    const now = new Date();

    const potArchiveEvent: PotArchiveEventV1 =
      PotArchiveEventV1.generatePotArchiveEvent(pot.pk, now, {
        potRoomPk: pot.pk,
      });

    try {
      PotEventReducer.reduce(pot, potArchiveEvent, true);
    } catch (error) {
      if (error instanceof PotEventError) {
        return error.baseResultDto;
      }
      throw error;
    }

    await this.dbService.db.transaction(async (tx: TxType) => {
      await this.potRoomRepository.archivePotRoom(pot.pk, tx);
      await this.userPotRoomRepository.archiveByPotRoomFk(pot.pk, tx);
      await this.potEventRepository.saveEvent(potArchiveEvent, tx);
    });

    this.broadcastingService.asyncBroadcastPotEvent(
      {
        pot_pk: pot.pk,
        timestamp: getUnixTime(potArchiveEvent.timestamp),
        id: potArchiveEvent.id,
        event_type: potArchiveEvent.eventType,
        data: potArchiveEvent.toDto(),
      },
      pot.joinedUserPks,
    );

    // 포포 예약 모두 삭제
    await this.popoService.deleteAllPopoChatReservation(pot.pk);

    return BaseResultDto.OK;
  }

  async getPot(potRoomPk: string): Promise<Pot | null> {
    // TODO: 팟 캐싱 로직 고려 필요
    // 여러 서버가 사용될 경우 pot 의 일관성을 보장할 수 없음
    // 우선 로직만 따로 분리해 둡니다.
    const pot: Pot =
      await this.potEventRepository.findByIdWithoutChat(potRoomPk);
    if (!pot.pk) {
      return null;
    }
    return pot;
  }

  private createPotCreateEvent(
    req: CreatePotReqDto,
    route: RouteEntity,
    userId: string,
  ): PotCreateEventV1 {
    const now = new Date();
    const potRoomPk = randomUUID();
    const roomName = this.createPotRoomName(route, potRoomPk);

    return PotCreateEventV1.generatePotCreateEvent(potRoomPk, now, {
      potRoomPk: potRoomPk,
      name: roomName,
      createUserId: userId,
      routePk: route.pk,
      maxCapacity: req.max_count,
      departureAvailableStartTime: req.starts_at,
      departureAvailableEndTime: req.ends_at,
      createAt: now,
      updateAt: now,
    });
  }

  private createPotRoomName(route: RouteEntity, potRoomPk: string): string {
    return (
      route.fromStop.nameKor[0] +
      route.toStop.nameKor[0] +
      potRoomPk.slice(0, 4)
    );
  }
}
