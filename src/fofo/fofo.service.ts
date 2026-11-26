import {
  forwardRef,
  Inject,
  Injectable,
  Logger,
  OnModuleInit,
} from "@nestjs/common";
import { addMinutes } from "date-fns";
import { FofoChatMsgEntity } from "@src/database/entity/fofo-chat-msg.entity";
import { FofoChatMsgRepository } from "@src/database/repository/fofo-chat-msg.repository";
import { FofoChatReservationRepository } from "@src/database/repository/fofo-chat-reservation.repository";
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
import { FofoChatStringType } from "@drizzle-schema/fofo-chat-msg";
import { FofoChatReservationEntity } from "@src/database/entity/fofo-chat-reservation.entity";
import { FofoChatDeliveryRepository } from "@src/database/repository/fofo-chat-delivery.repository";
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
import { isDelayCheckChatType } from "./fofo-chat-type";

@Trace()
@Injectable()
export class FofoService implements OnModuleInit {
  private readonly logger = new Logger(FofoService.name);
  private cachedFofoChatMsgs: FofoChatMsgEntity[] = [];
  private cacheGeneration = 0;
  private appliedCacheGeneration = 0;
  readonly reservationCreated$ = new Subject<FofoChatReservationEntity>();
  readonly reservationsCancelled$ = new Subject<{
    potPk: string;
    type?: FofoChatStringType;
  }>();

  constructor(
    private readonly dbService: DatabaseService,
    private readonly fofoChatMsgRepository: FofoChatMsgRepository,
    private readonly fofoChatReservationRepository: FofoChatReservationRepository,
    private readonly potEventRepository: PotEventRepository,
    @Inject(forwardRef(() => BroadcastingService))
    private readonly broadcastingService: BroadcastingService,
    @Inject(forwardRef(() => PotService))
    private readonly potService: PotService,
    private readonly deliveryRepository: FofoChatDeliveryRepository,
    private readonly potRoomRepository: PotRoomRepository,
  ) {}

  async onModuleInit() {
    await this.cacheFofoChatMsgs();
  }

  async processReservedFofoChatMsg() {
    const reservations =
      await this.fofoChatReservationRepository.findAllReadyToSend();
    for (const reservation of reservations) {
      try {
        await this.processReservedFofoChatReservation(reservation.pk);
      } catch (error) {
        this.logger.error(
          "Failed to process reservation " + reservation.pk,
          error,
        );
      }
    }
    await this.processPendingDeliveries();
  }

  async processReservedFofoChatReservation(pk: string): Promise<void> {
    await this.dbService.db.transaction(async (tx: TxType) => {
      const candidate = await this.fofoChatReservationRepository.findByPk(
        pk,
        tx,
      );
      if (!candidate) return;

      // 팟을 먼저 잠근 뒤 예약을 잠가 동시 처리 시 잠금 순서를 일관되게 유지합니다.
      const room = await this.potRoomRepository.lockByPk(candidate.potFk, tx);
      const reservation =
        await this.fofoChatReservationRepository.findByPkForUpdate(pk, tx);
      if (!reservation || reservation.sendAfter > new Date()) return;
      if (!room || room.isArchived || room.isDeleted) {
        await this.fofoChatReservationRepository.deleteByPk(pk, tx);
        return;
      }

      const pot = await this.potEventRepository.findByIdWithoutChat(
        reservation.potFk,
        tx,
      );
      const type = reservation.fofoChatMsgType;
      if (
        !pot.pk ||
        pot.isArchived ||
        !(await this.shouldSendReservation(type, pot))
      ) {
        await this.fofoChatReservationRepository.deleteByPk(pk, tx);
        return;
      }

      const template = this.getFofoChatMsgByType(type);
      if (!template)
        throw new Error("Fofo message template not found: " + type);

      // 팟 해산은 메시지가 아니라 로직이므로, 메시지 발송을 꺼도 해산은 그대로 진행한다.
      const archivesPot =
        type === "popo-auto-archive-no-departure-confirm-v1" ||
        type === "popo-auto-archive-v1";
      if (!template.enabled && !archivesPot) {
        await this.fofoChatReservationRepository.deleteByPk(pk, tx);
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
          await this.saveFofoChatEvent(template, pot, formatArguments, tx),
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
            type === "fofo-delay-check-request-v1" ? pot.departureTime : null,
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
      await this.fofoChatReservationRepository.deleteByPk(pk, tx);
    });

    await this.deliverReservedEvents(pk);
  }

  private async shouldSendReservation(
    type: FofoChatStringType,
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
      case "fofo-delay-check-request-v1":
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
          isDelayCheckChatType(
            (event.data as { popo_chat_type?: string }).popo_chat_type,
          ),
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

  private async saveFofoChatEvent(
    template: FofoChatMsgEntity,
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
  resolveSendAt(fofoChatMsg: FofoChatMsgEntity, anchor: Date): Date {
    return addMinutes(anchor, fofoChatMsg.offsetMinutes ?? 0);
  }

  /**
   * 정책 오프셋을 적용해 발송을 예약한다. 계산된 시각이 이미 지났다면 곧바로 발송되도록 예약한다.
   */
  asyncReserveFofoChatMsgFromAnchor(
    fofoChatMsg: FofoChatMsgEntity,
    anchor: Date,
    potPk?: string,
    pot?: Pot,
    formatArguments?: any,
  ) {
    const scheduledAt = this.resolveSendAt(fofoChatMsg, anchor);
    this.runAsync(async () => {
      // 팟 조회 등으로 시간이 지체될 수 있으므로, 실제 예약 직전에 지난 시각을 보정한다.
      const resolvedPot = await this.resolvePot(potPk, pot);
      const earliest = new Date(Date.now() + 1_000);
      await this.reserveFofoChatMsg(
        fofoChatMsg,
        scheduledAt > earliest ? scheduledAt : earliest,
        undefined,
        resolvedPot,
        formatArguments,
      );
    });
  }

  asyncReserveFofoChatMsg(
    fofoChatMsg: FofoChatMsgEntity,
    sendAfter: Date,
    potPk?: string,
    pot?: Pot,
    formatArguments?: any,
  ) {
    this.runAsync(() =>
      this.reserveFofoChatMsg(
        fofoChatMsg,
        sendAfter,
        potPk,
        pot,
        formatArguments,
      ),
    );
  }

  private runAsync(task: () => Promise<void>) {
    defer(task)
      .pipe(
        subscribeOn(asyncScheduler),
        catchError((err) => {
          this.logger.error("Reserve Fofo Chat Msg Failed: ", err);
          return EMPTY;
        }),
      )
      .subscribe();
  }

  async reserveFofoChatMsg(
    fofoChatMsg: FofoChatMsgEntity,
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

    const newFofoChatReservation: FofoChatReservationEntity = {
      potFk: pot.pk,
      fofoChatMsgType: fofoChatMsg.type,
      sendAfter: sendAfter,
      createdAt: now,
      updatedAt: now,
      formatArguments: formatArguments,
    };

    const reservation = await this.dbService.db.transaction(
      async (tx: TxType) => {
        return this.fofoChatReservationRepository.insert(
          newFofoChatReservation,
          tx,
        );
      },
    );
    this.reservationCreated$.next(reservation);
  }

  asyncSendFofoChatMsgToPotRoom(
    fofoChatMsg: FofoChatMsgEntity,
    potPk?: string,
    pot?: Pot,
    formatArguments?: any,
  ) {
    defer(() =>
      this.sendFofoChatMsgToPotRoom(fofoChatMsg, potPk, pot, formatArguments),
    )
      .pipe(
        subscribeOn(asyncScheduler),
        catchError((err) => {
          this.logger.error("Send Fofo Chat Msg Failed: ", err);
          return EMPTY;
        }),
      )
      .subscribe();
  }

  asyncSendFofoChatMsgToPotRoomWithDelay(
    fofoChatMsg: FofoChatMsgEntity,
    delayMs: number,
    potPk?: string,
    pot?: Pot,
    formatArguments?: any,
  ) {
    defer(() =>
      this.sendFofoChatMsgToPotRoom(fofoChatMsg, potPk, pot, formatArguments),
    )
      .pipe(
        delay(delayMs),
        subscribeOn(asyncScheduler),
        catchError((err) => {
          this.logger.error("Send Fofo Chat Msg Failed: ", err);
          return EMPTY;
        }),
      )
      .subscribe();
  }

  async sendFofoChatMsgToPotRoom(
    fofoChatMsg: FofoChatMsgEntity,
    potPk?: string,
    pot?: Pot,
    formatArguments?: any,
  ) {
    if (!fofoChatMsg.enabled) return;

    pot = await this.resolvePot(potPk, pot);

    const now = new Date();

    const potFofoChatMsgEvent: PotPopoChatEventV1 =
      PotPopoChatEventV1.generateEvent(pot.pk, now, {
        popoChatType: fofoChatMsg.type,
        message: fofoChatMsg.message,
        actionBtns: fofoChatMsg.actionBtns,
        timestamp: now,
        formatArguments: formatArguments,
      });

    try {
      PotEventReducer.reduce(pot, potFofoChatMsgEvent, true);
    } catch (error) {
      if (error instanceof PotEventError) {
        return error.baseResultDto;
      }
      throw error;
    }

    await this.dbService.db.transaction(async (tx: TxType) => {
      await this.potEventRepository.saveEvent(potFofoChatMsgEvent, tx);
    });

    this.broadcastingService.asyncBroadcastPotEvent(
      {
        pot_pk: pot.pk,
        timestamp: getUnixTime(potFofoChatMsgEvent.timestamp),
        id: potFofoChatMsgEvent.id,
        event_type: potFofoChatMsgEvent.eventType,
        data: potFofoChatMsgEvent.toDto(),
      },
      pot.joinedUserPks,
      pot.name,
    );
  }

  asyncDeleteFofoChatReservation(
    fofoChatMsgType: FofoChatStringType,
    potPk: string,
  ) {
    defer(() => this.deleteFofoChatReservation(fofoChatMsgType, potPk))
      .pipe(
        subscribeOn(asyncScheduler),
        catchError((err) => {
          this.logger.error("Delete Fofo Chat Reservation Failed: ", err);
          return EMPTY;
        }),
      )
      .subscribe();
  }

  async deleteFofoChatReservation(
    fofoChatMsgType: FofoChatStringType,
    potPk: string,
  ) {
    await this.dbService.db.transaction(async (tx: TxType) => {
      await this.fofoChatReservationRepository.deleteByPotFkAndType(
        potPk,
        fofoChatMsgType,
        tx,
      );
    });
    this.reservationsCancelled$.next({ potPk, type: fofoChatMsgType });
  }

  async deleteAllFofoChatReservation(potPk: string) {
    await this.dbService.db.transaction(async (tx: TxType) => {
      await this.fofoChatReservationRepository.deleteByPotFk(potPk, tx);
    });
    this.reservationsCancelled$.next({ potPk });
  }

  async deleteAllFofoChatReservationInTransaction(potPk: string, tx: TxType) {
    await this.fofoChatReservationRepository.deleteByPotFk(potPk, tx);
  }

  getFofoChatMsgByType(type: FofoChatStringType): FofoChatMsgEntity | null {
    return this.cachedFofoChatMsgs.find((msg) => msg.type === type) || null;
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

  /**
   * 어드민에서 메시지 정책을 수정한 뒤 캐시를 갱신한다.
   * 일시적인 DB 오류에 대비해 몇 번 재시도하고, 모두 실패하면 에러를 던진다.
   */
  async reloadFofoChatMsgs(retries = 3) {
    for (let attempt = 1; ; attempt++) {
      try {
        await this.cacheFofoChatMsgs();
        return;
      } catch (err) {
        if (attempt >= retries) throw err;
        this.logger.warn(
          `Reload fofo chat msg cache failed (attempt ${attempt}/${retries})`,
        );
        await new Promise((resolve) => setTimeout(resolve, 200 * attempt));
      }
    }
  }

  private async cacheFofoChatMsgs() {
    // 요청이 겹칠 때 먼저 시작한 조회가 나중에 끝나도 최신 결과를 덮어쓰지 않도록 한다.
    const generation = ++this.cacheGeneration;
    const msgs = await this.fofoChatMsgRepository.findAll();
    if (generation > this.appliedCacheGeneration) {
      this.appliedCacheGeneration = generation;
      this.cachedFofoChatMsgs = msgs;
    }
  }
}
