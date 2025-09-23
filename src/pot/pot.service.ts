import { BadRequestException, Injectable } from "@nestjs/common";
import { CreatePotReqDto, CreatePotResDto } from "@src/pot/dto/create.pot.dto";
import { UserContext } from "@src/auth/user-context.entity";
import { PotEventReducer } from "@src/pot/event/pot-event-reducer";
import { PotCreateEventV1 } from "@src/pot/event/pot-create-event";
import { RouteService } from "@src/discovery/route.service";
import { DatabaseService } from "@src/database/database.service";
import { RouteEntity } from "@src/discovery/model/route.entity";
import { randomUUID } from "node:crypto";
import { PotRoomEntity } from "@src/discovery/model/pot-room.entity";
import { TxType } from "@src/global/types/tx.types";
import { PotEventRepository } from "@src/pot/repository/pot-event.repository";
import { PotRoomRepository } from "@src/discovery/repository/pot-room.repository";
import { UserPotRoomEntity } from "@src/pot/model/user-pot-room.entity";
import { UserPotRoomRepository } from "@src/pot/repository/user-pot-room.repository";
import { BaseResultDto } from "@src/global/dto/base-result.dto";
import { Pot } from "@src/pot/model/pot";
import { PotUserInEventV1 } from "@src/pot/event/pot-user-in-event";
import { PotUserLeaveEventV1 } from "@src/pot/event/pot-user-leave-event";
import { PotUserKickEventV1 } from "@src/pot/event/pot-user-kick-event";
import { PotDepartureConfirmEventV1 } from "@src/pot/event/pot-departure-confirm-event";
import { PotEventError } from "@src/global/exceptions/pot-event.error";

@Injectable()
export class PotService {
  constructor(
    private readonly dbService: DatabaseService,
    private readonly routeService: RouteService,
    private readonly potRoomRepository: PotRoomRepository,
    private readonly potEventRepository: PotEventRepository,
    private readonly userPotRoomRepository: UserPotRoomRepository,
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

    const pot = PotEventReducer.reduceFromInitial([potCreateEvent]);
    const potRoomEntity: PotRoomEntity = pot.toPotRoomEntity();

    // userPotRoom Entity 생성
    const userPotRoomEntity: UserPotRoomEntity = {
      potRoomFk: potRoomEntity.pk,
      userFk: userCtx.userId,
      isHost: true,
    };

    await this.dbService.db.transaction(async (tx: TxType) => {
      await this.potRoomRepository.insert(potRoomEntity, tx);
      await this.potEventRepository.saveEvent(potCreateEvent, tx);
      await this.userPotRoomRepository.insert(userPotRoomEntity, tx);
    });

    return {
      id: potRoomEntity.pk,
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
    const pot: Pot = await this.potEventRepository.findByIdWithoutChat(potPk);
    if (!pot.pk) {
      return BaseResultDto.PotNotExist;
    }

    const potUserInEvent: PotUserInEventV1 =
      PotUserInEventV1.generatePotUserInEvent(potPk, new Date(), {
        potRoomPk: potPk,
        userPk: userCtx.userId,
      });

    try {
      PotEventReducer.reduce(pot, potUserInEvent);
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
    };

    await this.dbService.db.transaction(async (tx: TxType) => {
      await this.potEventRepository.saveEvent(potUserInEvent, tx);
      await this.userPotRoomRepository.insert(userPotRoomEntity, tx);
    });

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
    const pot: Pot = await this.potEventRepository.findByIdWithoutChat(potPk);
    if (!pot.pk) {
      return BaseResultDto.PotNotExist;
    }

    const potUserLeaveEvent: PotUserLeaveEventV1 =
      PotUserLeaveEventV1.generatePotUserLeaveEvent(potPk, new Date(), {
        potRoomPk: potPk,
        userPk: userCtx.userId,
      });

    try {
      PotEventReducer.reduce(pot, potUserLeaveEvent);
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
    });

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
    const pot: Pot = await this.potEventRepository.findByIdWithoutChat(potPk);
    if (!pot.pk) {
      return BaseResultDto.PotNotExist;
    }

    const potUserKickEvent: PotUserKickEventV1 =
      PotUserKickEventV1.generatePotUserKickEvent(potPk, new Date(), {
        potRoomPk: potPk,
        userPk: userCtx.userId,
        kickedUserPk: targetUserId,
      });

    try {
      PotEventReducer.reduce(pot, potUserKickEvent);
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
    const pot: Pot = await this.potEventRepository.findByIdWithoutChat(potPk);
    if (!pot.pk) {
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
      PotEventReducer.reduce(pot, potDepartureConfirmEvent);
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

    return BaseResultDto.OK;
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
