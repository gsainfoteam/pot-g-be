import { Injectable } from "@nestjs/common";
import { DatabaseService } from "@src/database/database.service";
import { PopoChatReservationEntity } from "@src/database/entity/popo-chat-reservation.entity";
import { TxType } from "@src/global/types/tx.types";
import { popoChatReservation } from "../../../drizzle/schema/popo-chat-reservation";
import { randomUUID } from "node:crypto";

@Injectable()
export class PopoChatReservationRepository {
  constructor(private readonly dbService: DatabaseService) {}

  async insert(
    popoChatReservationEntity: PopoChatReservationEntity,
    tx: TxType,
  ): Promise<PopoChatReservationEntity> {
    const result = await tx
      .insert(popoChatReservation)
      .values({
        pk: popoChatReservationEntity.pk || randomUUID(),
        potFk: popoChatReservationEntity.potFk,
        popoChatMsgType: popoChatReservationEntity.popoChatMsgType,
        sendAfter: popoChatReservationEntity.sendAfter,
        createdAt: popoChatReservationEntity.createdAt,
        updatedAt: popoChatReservationEntity.updatedAt,
      })
      .returning();

    if (result.length === 0) {
      throw new Error("Failed to insert popo chat reservation"); // TODO
    }

    const insertedReservation = result[0];
    return this.resultToPopoChatReservationEntity(insertedReservation);
  }

  private resultToPopoChatReservationEntity(
    result: any,
  ): PopoChatReservationEntity {
    return {
      pk: result.pk,
      potFk: result.potFk,
      popoChatMsgType: result.popoChatMsgType,
      sendAfter: result.sendAfter,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
    };
  }
}
