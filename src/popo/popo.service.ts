import { forwardRef, Inject, Injectable, OnModuleInit } from "@nestjs/common";
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
  }

  asyncReservePopoChatMsg(
    popoChatMsg: PopoChatMsgEntity,
    sendAfter: Date,
    potPk?: string,
    pot?: Pot,
  ) {
    scheduled(
      this.reservePopoChatMsg(popoChatMsg, sendAfter, potPk, pot),
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
  ) {
    scheduled(
      this.sendPopoChatMsgToPotRoom(popoChatMsg, potPk, pot),
      asyncScheduler,
    ).subscribe({
      error: (err) => console.error("Send PopoChatMsg failed:", err),
    });
  }

  async sendPopoChatMsgToPotRoom(
    popoChatMsg: PopoChatMsgEntity,
    potPk?: string,
    pot?: Pot,
  ) {
    pot = await this.resolvePot(potPk, pot);

    const now = new Date();

    const potPopoChatMsgEvent: PotPopoChatEventV1 =
      PotPopoChatEventV1.generateEvent(pot.pk, now, {
        popoChatType: popoChatMsg.type,
        message: popoChatMsg.message,
        actionBtns: popoChatMsg.actionBtns,
        timestamp: now,
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
