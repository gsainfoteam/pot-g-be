import { forwardRef, Inject, Injectable, OnModuleInit } from "@nestjs/common";
import { PopoChatMsgEntity } from "@src/database/entity/popo-chat-msg.entity";
import { PopoChatMsgRepository } from "@src/database/repository/popo-chat-msg.repository";
import { PopoChatReservationRepository } from "@src/database/repository/popo-chat-reservation.repository";
import { BroadcastingService } from "@src/broadcasting/broadcasting.service";
import { PotService } from "@src/pot/pot.service";
import { Pot } from "@src/pot/model/pot";

@Injectable()
export class PopoService implements OnModuleInit {
  private cachedPopoChatMsgs: PopoChatMsgEntity[] = [];

  constructor(
    private readonly popoChatMsgRepository: PopoChatMsgRepository,
    private readonly popoChatReservationRepository: PopoChatReservationRepository,
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

  async reservePopoChatMsg(
    potPk: string,
    popoChatMsg: PopoChatMsgEntity,
    sendAfter: Date,
  ) {}

  async sendPopoChatMsgToPotRoom(
    potPk?: string,
    pot?: Pot,
    popoChatMsg: PopoChatMsgEntity,
  ) {
    if (!pot && !potPk) {
      throw new Error("Either pot or potPk must be provided");
    }
    if (!pot && potPk) {
      pot = await this.potService.getPot(potPk);
    }
  }

  private async cachePopoChatMsgs() {
    this.cachedPopoChatMsgs = await this.popoChatMsgRepository.findAll();
  }
}
