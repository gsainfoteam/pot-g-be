import {
  forwardRef,
  Inject,
  Injectable,
  Logger,
  OnModuleInit,
} from "@nestjs/common";
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
import { asyncScheduler, scheduled } from "rxjs";

@Injectable()
export class PopoService implements OnModuleInit {
  private readonly logger = new Logger(PopoService.name);
  private cachedPopoChatMsgs: PopoChatMsgEntity[] = [];

  constructor(
    private readonly dbService: DatabaseService,
    private readonly popoChatMsgRepository: PopoChatMsgRepository,
    private readonly popoChatReservationRepository: PopoChatReservationRepository,
    private readonly potEventRepository: PotEventRepository,
    private readonly broadcastingService: BroadcastingService,
    @Inject(forwardRef(() => PotService))
    private readonly potService: PotService,
  ) {}

  async onModuleInit() {
    await this.cachePopoChatMsgs();
  }

  async processReservedPopoChatMsg() {
    // Implementation for processing reserved Popo chat messages
    const reservations =
      await this.popoChatReservationRepository.findAllReadyToSend();

    /*
    예약 되어있는것들
    popo-departure-confirm-request (출발 시간 확정 시 무시)
    popo-reminder-taxi-call (반드시 발송)
    popo-accounting-reminder (정산 요청 들어왔을 경우 무시)
    나머지 -> 무시

    같은 팟의 같은 타입이 여러가 있는 경우는 이론상 없으므로 반드시 매번 pot 을 조회해 주어야 함.
    -> 느려지는 원인이 될 수 있긴 하지만 유저 요청도 아니기 때문에 우선 무시
     */
    for (const reservation of reservations) {
      // try catch 로 감싸서 하나 실패해도 계속 진행되도록 함
      try {
        switch (reservation.popoChatMsgType) {
          case "popo-departure-confirm-request-v1":
            await this.processDepartureConfirmRequest(reservation);
            break;
          case "popo-reminder-taxi-call-v1":
            await this.processReminderTaxiCall(reservation);
            break;
          case "popo-accounting-reminder-v1":
            await this.processAccountingReminder(reservation);
            break;
          case "popo-auto-archive-no-departure-confirm-v1":
            await this.processAutoArchiveNoDepartureConfirm(reservation);
            break;
          default:
            // Do nothing for other types
            break;
        }

        // 처리 완료 후 삭제
        await this.dbService.db.transaction(async (tx: TxType) => {
          await this.popoChatReservationRepository.deleteByPk(
            reservation.pk,
            tx,
          );
        });
      } catch (error) {
        // TODO: 에러 핸들링 필요 -> 재예약?
        this.logger.error(error);
      }
    }
  }

  private async processDepartureConfirmRequest(
    reservation: PopoChatReservationEntity,
  ) {
    // 출발 시간 확정 시 무시
    const pot = await this.potService.getPot(reservation.potFk);

    if (pot.departureTime) {
      // 출발 시간 확정 되어있음 -> 무시
      return;
    }

    const departureConfirmedPopoChatMsg = this.getPopoChatMsgByType(
      "popo-departure-confirmed-v1",
    );

    this.asyncSendPopoChatMsgToPotRoom(
      departureConfirmedPopoChatMsg,
      reservation.potFk,
      pot,
      reservation.formatArguments,
    );
  }

  private async processReminderTaxiCall(
    reservation: PopoChatReservationEntity,
  ) {
    // 반드시 발송
    const reminderTaxiCallPopoChatMsg = this.getPopoChatMsgByType(
      "popo-reminder-taxi-call-v1",
    );

    this.asyncSendPopoChatMsgToPotRoom(
      reminderTaxiCallPopoChatMsg,
      reservation.potFk,
      null,
      reservation.formatArguments,
    );
  }

  private async processAccountingReminder(
    reservation: PopoChatReservationEntity,
  ) {
    // 정산 요청 들어왔을 경우 무시
    const pot = await this.potService.getPot(reservation.potFk);

    if (pot.accountingRequestUserId) {
      // 정산 요청 들어왔음 -> 무시
      return;
    }

    const accountingReminderPopoChatMsg = this.getPopoChatMsgByType(
      "popo-accounting-reminder-v1",
    );

    this.asyncSendPopoChatMsgToPotRoom(
      accountingReminderPopoChatMsg,
      reservation.potFk,
      pot,
      reservation.formatArguments,
    );
  }

  private async processAutoArchiveNoDepartureConfirm(
    reservation: PopoChatReservationEntity,
  ) {
    // 출발 시간이 확정된 경우 무시
    const pot = await this.potService.getPot(reservation.potFk);

    // 이미 아카이브 된 경우 무시
    if (pot.isArchived) {
      return;
    }

    if (pot.departureTime) {
      // 출발 시간 확정됨 -> 무시
      return;
    }

    // 출발 시간이 확정되지 않은 경우 팟 자동 아카이브
    const autoArchiveNoDeparturePopoChatMsg = this.getPopoChatMsgByType(
      "popo-auto-archive-no-departure-confirm-v1",
    );

    this.asyncSendPopoChatMsgToPotRoom(
      autoArchiveNoDeparturePopoChatMsg,
      reservation.potFk,
      pot,
      reservation.formatArguments,
    );

    // 팟 아카이브 진행
    await this.potService.archivePot(pot);
  }

  asyncReservePopoChatMsg(
    popoChatMsg: PopoChatMsgEntity,
    sendAfter: Date,
    potPk?: string,
    pot?: Pot,
    formatArguments?: any,
  ) {
    scheduled(
      this.reservePopoChatMsg(
        popoChatMsg,
        sendAfter,
        potPk,
        pot,
        formatArguments,
      ),
      asyncScheduler,
    ).subscribe({
      error: (err) => console.error("Reserve PopoChatMsg failed:", err),
    });
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

    await this.dbService.db.transaction(async (tx: TxType) => {
      await this.popoChatReservationRepository.insert(
        newPopoChatReservation,
        tx,
      );
    });
  }

  asyncSendPopoChatMsgToPotRoom(
    popoChatMsg: PopoChatMsgEntity,
    potPk?: string,
    pot?: Pot,
    formatArguments?: any,
  ) {
    scheduled(
      this.sendPopoChatMsgToPotRoom(popoChatMsg, potPk, pot, formatArguments),
      asyncScheduler,
    ).subscribe({
      error: (err) => console.error("Send PopoChatMsg failed:", err),
    });
  }

  async sendPopoChatMsgToPotRoom(
    popoChatMsg: PopoChatMsgEntity,
    potPk?: string,
    pot?: Pot,
    formatArguments?: any,
  ) {
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
        event_type: potPopoChatMsgEvent.eventType,
        data: potPopoChatMsgEvent.toDto(),
      },
      pot.joinedUserPks,
    );
  }

  asyncDeletePopoChatReservation(
    popoChatMsgType: PopoChatStringType,
    potPk: string,
  ) {
    scheduled(
      this.deletePopoChatReservation(popoChatMsgType, potPk),
      asyncScheduler,
    ).subscribe({
      error: (err) => console.error("Send PopoChatMsg failed:", err),
    });
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
  }

  async deleteAllPopoChatReservation(potPk: string) {
    await this.dbService.db.transaction(async (tx: TxType) => {
      await this.popoChatReservationRepository.deleteByPotFk(potPk, tx);
    });
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

  private async cachePopoChatMsgs() {
    this.cachedPopoChatMsgs = await this.popoChatMsgRepository.findAll();
  }
}
