import {
  forwardRef,
  Inject,
  Injectable,
  Logger,
  OnModuleInit,
} from "@nestjs/common";
import { addMinutes } from "date-fns";
import { PopoChatMsgEntity } from "@src/database/entity/popo-chat-msg.entity";
import { PopoChatMsgRepository } from "@src/database/repository/popo-chat-msg.repository";
import { PopoChatReservationRepository } from "@src/database/repository/popo-chat-reservation.repository";
import { BroadcastingService } from "@src/broadcasting/broadcasting.service";
import { PotService } from "@src/pot/pot.service";
import { Pot } from "@src/pot/model/pot";
import { PotPopoChatEventV1 } from "@src/pot/event/v1/pot-popo-chat-event";
import { PotEventReducer } from "@src/pot/event/pot-event-reducer";
import { PotEventError } from "@src/global/exceptions/pot-event.error";
import { getUnixTime } from "date-fns";
import { TxType } from "@src/global/types/tx.types";
import { DatabaseService } from "@src/database/database.service";
import { PotEventRepository } from "@src/database/repository/pot-event.repository";
import { PopoChatStringType } from "../../drizzle/schema/popo-chat-msg";
import { PopoChatReservationEntity } from "@src/database/entity/popo-chat-reservation.entity";
import { PopoChatDeliveryRepository } from "@src/database/repository/popo-chat-delivery.repository";
import { PotRoomRepository } from "@src/database/repository/pot-room.repository";
import { PotEvent } from "@src/pot/event/pot-event";
import {
  asyncScheduler,
  catchError,
  defer,
  delay,
  EMPTY,
  subscribeOn,
  Subject,
} from "rxjs";
import { Trace } from "@gsainfoteam/nest-observability";

@Trace()
@Injectable()
export class PopoService implements OnModuleInit {
  private readonly logger = new Logger(PopoService.name);
  private cachedPopoChatMsgs: PopoChatMsgEntity[] = [];
  readonly reservationCreated$ = new Subject<PopoChatReservationEntity>();
  readonly reservationsCancelled$ = new Subject<{
    potPk: string;
    type?: PopoChatStringType;
  }>();

  constructor(
    private readonly dbService: DatabaseService,
    private readonly popoChatMsgRepository: PopoChatMsgRepository,
    private readonly popoChatReservationRepository: PopoChatReservationRepository,
    private readonly potEventRepository: PotEventRepository,
    @Inject(forwardRef(() => BroadcastingService))
    private readonly broadcastingService: BroadcastingService,
    @Inject(forwardRef(() => PotService))
    private readonly potService: PotService,
    private readonly deliveryRepository: PopoChatDeliveryRepository,
    private readonly potRoomRepository: PotRoomRepository,
  ) {}

  async onModuleInit() {
    await this.cachePopoChatMsgs();
  }

  async processReservedPopoChatMsg() {
    const reservations =
      await this.popoChatReservationRepository.findAllReadyToSend();
    for (const reservation of reservations) {
      try {
        await this.processReservedPopoChatReservation(reservation.pk);
      } catch (error) {
        this.logger.error(
          "Failed to process reservation " + reservation.pk,
          error,
        );
      }
    }
    await this.processPendingDeliveries();
  }

  async processReservedPopoChatReservation(pk: string): Promise<void> {
    await this.dbService.db.transaction(async (tx: TxType) => {
      const candidate = await this.popoChatReservationRepository.findByPk(
        pk,
        tx,
      );
      if (!candidate) return;

      // 팟을 먼저 잠근 뒤 예약을 잠가 동시 처리 시 잠금 순서를 일관되게 유지합니다.
      const room = await this.potRoomRepository.lockByPk(candidate.potFk, tx);
      const reservation =
        await this.popoChatReservationRepository.findByPkForUpdate(pk, tx);
      if (!reservation || reservation.sendAfter > new Date()) return;
      if (!room || room.isArchived || room.isDeleted) {
        await this.popoChatReservationRepository.deleteByPk(pk, tx);
        return;
      }

      const pot = await this.potEventRepository.findByIdWithoutChat(
        reservation.potFk,
        tx,
      );
      const type = reservation.popoChatMsgType;
      if (
        !pot.pk ||
        pot.isArchived ||
        !(await this.shouldSendReservation(type, pot))
      ) {
        await this.popoChatReservationRepository.deleteByPk(pk, tx);
        return;
      }

      const template = this.getPopoChatMsgByType(type);
      if (!template)
        throw new Error("Popo message template not found: " + type);

      // 팟 해산은 메시지가 아니라 로직이므로, 메시지 발송을 꺼도 해산은 그대로 진행한다.
      const archivesPot =
        type === "popo-auto-archive-no-departure-confirm-v1" ||
        type === "popo-auto-archive-v1";
      if (!template.enabled && !archivesPot) {
        await this.popoChatReservationRepository.deleteByPk(pk, tx);
        return;
      }

      const events: PotEvent<any, any>[] = [];
      if (template.enabled) {
        const formatArguments = { ...reservation.formatArguments };
        if (type === "popo-reminder-taxi-call-v1" && pot.departureTime) {
          formatArguments.remainDepartureTime = Math.max(
            0,
            Math.floor((pot.departureTime.getTime() - Date.now()) / 60_000),
          );
        }
        events.push(
          await this.savePopoChatEvent(template, pot, formatArguments, tx),
        );
      }
      if (archivesPot) {
        events.push(await this.potService.archivePotInTransaction(pot, tx));
      }

      // 이벤트와 전달 작업을 같은 트랜잭션에 저장해 전송 실패 시 재시도할 수 있도록 합니다.
      await this.deliveryRepository.insert(
        {
          pk: reservation.pk,
          potFk: pot.pk,
          potName: pot.name,
          userPks: pot.joinedUserPks,
          expiresAt:
            type === "popo-delay-check-request-v1" ? pot.departureTime : null,
          events: events.map((event) => ({
            pot_pk: pot.pk,
            timestamp: getUnixTime(event.timestamp),
            id: event.id,
            event_type: event.eventType,
            data: event.toDto(),
          })),
        },
        tx,
      );
      await this.popoChatReservationRepository.deleteByPk(pk, tx);
    });

    await this.deliverReservedEvents(pk);
  }

  private async shouldSendReservation(
    type: PopoChatStringType,
    pot: Pot,
  ): Promise<boolean> {
    switch (type) {
      case "popo-departure-confirm-request-v1":
      case "popo-auto-archive-no-departure-confirm-v1":
        return !pot.departureTime;
      case "popo-reminder-taxi-call-v1":
      case "popo-auto-archive-v1":
        return true;
      case "popo-accounting-reminder-v1":
        return !pot.accountingRequestUserId;
      case "popo-delay-check-request-v1":
        return !!pot.departureTime && pot.departureTime > new Date();
      default:
        return false;
    }
  }

  async processPendingDeliveries(): Promise<void> {
    const deliveries = await this.deliveryRepository.findReady();
    for (const delivery of deliveries) {
      await this.deliverReservedEvents(delivery.pk);
    }
  }

  private async deliverReservedEvents(pk: string): Promise<void> {
    const delivery = await this.deliveryRepository.claim(pk);
    if (!delivery) return;
    let nextAttemptAt: Date | undefined;
    try {
      const pot = await this.potEventRepository.findByIdWithoutChat(
        delivery.potFk,
      );
      const archiveDelivery = delivery.events.some(
        (event) => event.event_type === "archive_v1",
      );
      const delayCheck = delivery.events.some(
        (event) =>
          event.event_type === "popo_chat_v1" &&
          (event.data as { popo_chat_type?: string }).popo_chat_type ===
            "popo-delay-check-request-v1",
      );
      // Old queued deliveries may not yet have expiresAt populated.
      const expiresAt =
        delivery.expiresAt ?? (delayCheck ? pot.departureTime : undefined);
      const expired =
        delayCheck && (!expiresAt || expiresAt.getTime() <= Date.now());
      const eligible =
        pot.pk &&
        !pot.isDeleted &&
        !expired &&
        (!pot.isArchived || archiveDelivery);
      const userPks = !eligible
        ? []
        : archiveDelivery
          ? delivery.userPks
          : delivery.userPks.filter((userPk) =>
              pot.joinedUserPks.includes(userPk),
            );
      for (const event of delivery.events) {
        const progress = (delivery.progress[event.id] ??= {});
        const next = await this.broadcastingService.broadcastReservedPotEvent(
          event,
          userPks,
          delivery.potName,
          progress,
          () =>
            this.deliveryRepository.saveProgress(
              pk,
              delivery.leaseToken,
              delivery.progress,
            ),
          expiresAt,
        );
        if (next && (!nextAttemptAt || next < nextAttemptAt))
          nextAttemptAt = next;
      }
    } catch (error) {
      nextAttemptAt = new Date(Date.now() + 60_000);
      this.logger.error("Failed to deliver reserved events " + pk, error);
    }
    await this.deliveryRepository.finishAttempt(
      pk,
      delivery.leaseToken,
      nextAttemptAt,
    );
  }

  private async savePopoChatEvent(
    template: PopoChatMsgEntity,
    pot: Pot,
    formatArguments: any,
    tx: TxType,
  ): Promise<PotPopoChatEventV1> {
    const now = new Date();
    const event = PotPopoChatEventV1.generateEvent(pot.pk, now, {
      popoChatType: template.type,
      message: template.message,
      actionBtns: template.actionBtns,
      timestamp: now,
      formatArguments,
    });
    PotEventReducer.reduce(pot, event, true);
    // 이벤트를 저장하기 전에 메시지 포맷팅 오류가 없는지 확인합니다.
    event.toDto();
    await this.potEventRepository.saveEvent(event, tx);
    return event;
  }

  /**
   * 기준 시각에 메시지 정책의 오프셋을 적용한 발송 시각을 계산한다.
   * 즉시 발송 메시지(offsetMinutes 가 null)는 기준 시각을 그대로 돌려준다.
   */
  resolveSendAt(popoChatMsg: PopoChatMsgEntity, anchor: Date): Date {
    return addMinutes(anchor, popoChatMsg.offsetMinutes ?? 0);
  }

  /**
   * 정책 오프셋을 적용해 발송을 예약한다. 계산된 시각이 이미 지났다면 곧바로 발송되도록 예약한다.
   */
  asyncReservePopoChatMsgFromAnchor(
    popoChatMsg: PopoChatMsgEntity,
    anchor: Date,
    potPk?: string,
    pot?: Pot,
    formatArguments?: any,
  ) {
    const earliest = new Date(Date.now() + 1_000);
    const sendAfter = this.resolveSendAt(popoChatMsg, anchor);
    this.asyncReservePopoChatMsg(
      popoChatMsg,
      sendAfter > earliest ? sendAfter : earliest,
      potPk,
      pot,
      formatArguments,
    );
  }

  asyncReservePopoChatMsg(
    popoChatMsg: PopoChatMsgEntity,
    sendAfter: Date,
    potPk?: string,
    pot?: Pot,
    formatArguments?: any,
  ) {
    defer(() =>
      this.reservePopoChatMsg(
        popoChatMsg,
        sendAfter,
        potPk,
        pot,
        formatArguments,
      ),
    )
      .pipe(
        subscribeOn(asyncScheduler),
        catchError((err) => {
          this.logger.error("Reserve Popo Chat Msg Failed: ", err);
          return EMPTY;
        }),
      )
      .subscribe();
  }

  async reservePopoChatMsg(
    popoChatMsg: PopoChatMsgEntity,
    sendAfter: Date,
    potPk?: string,
    pot?: Pot,
    formatArguments?: any,
  ) {
    pot = await this.resolvePot(potPk, pot);

    const now = new Date();

    if (sendAfter <= now) {
      throw new Error("sendAfter must be a future date");
    }

    const newPopoChatReservation: PopoChatReservationEntity = {
      potFk: pot.pk,
      popoChatMsgType: popoChatMsg.type,
      sendAfter: sendAfter,
      createdAt: now,
      updatedAt: now,
      formatArguments: formatArguments,
    };

    const reservation = await this.dbService.db.transaction(
      async (tx: TxType) => {
        return this.popoChatReservationRepository.insert(
          newPopoChatReservation,
          tx,
        );
      },
    );
    this.reservationCreated$.next(reservation);
  }

  asyncSendPopoChatMsgToPotRoom(
    popoChatMsg: PopoChatMsgEntity,
    potPk?: string,
    pot?: Pot,
    formatArguments?: any,
  ) {
    defer(() =>
      this.sendPopoChatMsgToPotRoom(popoChatMsg, potPk, pot, formatArguments),
    )
      .pipe(
        subscribeOn(asyncScheduler),
        catchError((err) => {
          this.logger.error("Send Popo Chat Msg Failed: ", err);
          return EMPTY;
        }),
      )
      .subscribe();
  }

  asyncSendPopoChatMsgToPotRoomWithDelay(
    popoChatMsg: PopoChatMsgEntity,
    delayMs: number,
    potPk?: string,
    pot?: Pot,
    formatArguments?: any,
  ) {
    defer(() =>
      this.sendPopoChatMsgToPotRoom(popoChatMsg, potPk, pot, formatArguments),
    )
      .pipe(
        delay(delayMs),
        subscribeOn(asyncScheduler),
        catchError((err) => {
          this.logger.error("Send Popo Chat Msg Failed: ", err);
          return EMPTY;
        }),
      )
      .subscribe();
  }

  async sendPopoChatMsgToPotRoom(
    popoChatMsg: PopoChatMsgEntity,
    potPk?: string,
    pot?: Pot,
    formatArguments?: any,
  ) {
    if (!popoChatMsg.enabled) return;

    pot = await this.resolvePot(potPk, pot);

    const now = new Date();

    const potPopoChatMsgEvent: PotPopoChatEventV1 =
      PotPopoChatEventV1.generateEvent(pot.pk, now, {
        popoChatType: popoChatMsg.type,
        message: popoChatMsg.message,
        actionBtns: popoChatMsg.actionBtns,
        timestamp: now,
        formatArguments: formatArguments,
      });

    try {
      PotEventReducer.reduce(pot, potPopoChatMsgEvent, true);
    } catch (error) {
      if (error instanceof PotEventError) {
        return error.baseResultDto;
      }
      throw error;
    }

    await this.dbService.db.transaction(async (tx: TxType) => {
      await this.potEventRepository.saveEvent(potPopoChatMsgEvent, tx);
    });

    this.broadcastingService.asyncBroadcastPotEvent(
      {
        pot_pk: pot.pk,
        timestamp: getUnixTime(potPopoChatMsgEvent.timestamp),
        id: potPopoChatMsgEvent.id,
        event_type: potPopoChatMsgEvent.eventType,
        data: potPopoChatMsgEvent.toDto(),
      },
      pot.joinedUserPks,
      pot.name,
    );
  }

  asyncDeletePopoChatReservation(
    popoChatMsgType: PopoChatStringType,
    potPk: string,
  ) {
    defer(() => this.deletePopoChatReservation(popoChatMsgType, potPk))
      .pipe(
        subscribeOn(asyncScheduler),
        catchError((err) => {
          this.logger.error("Delete Popo Chat Reservation Failed: ", err);
          return EMPTY;
        }),
      )
      .subscribe();
  }

  async deletePopoChatReservation(
    popoChatMsgType: PopoChatStringType,
    potPk: string,
  ) {
    await this.dbService.db.transaction(async (tx: TxType) => {
      await this.popoChatReservationRepository.deleteByPotFkAndType(
        potPk,
        popoChatMsgType,
        tx,
      );
    });
    this.reservationsCancelled$.next({ potPk, type: popoChatMsgType });
  }

  async deleteAllPopoChatReservation(potPk: string) {
    await this.dbService.db.transaction(async (tx: TxType) => {
      await this.popoChatReservationRepository.deleteByPotFk(potPk, tx);
    });
    this.reservationsCancelled$.next({ potPk });
  }

  async deleteAllPopoChatReservationInTransaction(potPk: string, tx: TxType) {
    await this.popoChatReservationRepository.deleteByPotFk(potPk, tx);
  }

  getPopoChatMsgByType(type: PopoChatStringType): PopoChatMsgEntity | null {
    return this.cachedPopoChatMsgs.find((msg) => msg.type === type) || null;
  }

  private async resolvePot(potPk?: string, pot?: Pot): Promise<Pot> {
    if (!pot && !potPk) {
      throw new Error("Either pot or potPk must be provided");
    }
    if (!pot && potPk) {
      pot = await this.potService.getPot(potPk);
    }

    if (!pot) {
      throw new Error("Pot not found");
    }

    return pot;
  }

  /** 어드민에서 메시지 정책을 수정한 뒤 캐시를 갱신한다. */
  async reloadPopoChatMsgs() {
    await this.cachePopoChatMsgs();
  }

  private async cachePopoChatMsgs() {
    this.cachedPopoChatMsgs = await this.popoChatMsgRepository.findAll();
  }
}
