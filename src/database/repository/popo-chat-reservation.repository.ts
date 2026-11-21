import { Injectable } from "@nestjs/common";
import { DatabaseService } from "@src/database/database.service";
import { PopoChatReservationEntity } from "@src/database/entity/popo-chat-reservation.entity";
import { TxType } from "@src/global/types/tx.types";
import { popoChatReservation } from "../../../drizzle/schema/popo-chat-reservation";
import { randomUUID } from "node:crypto";
import { and, asc, eq, lte } from "drizzle-orm";
import { PopoChatStringType } from "../../../drizzle/schema/popo-chat-msg";
import { PotgDBError } from "@src/global/exceptions/potg-db.error";

@Injectable()
export class PopoChatReservationRepository {
  constructor(private readonly dbService: DatabaseService) {}

  /*
  INSERT INTO popo_chat_reservation
    (pk, pot_fk, popo_chat_msg_type, send_after, created_at, updated_at, format_arguments)
  VALUES ($1, $2, $3, $4, $5, $6, $7)
  RETURNING *;
   */
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
        formatArguments: popoChatReservationEntity.formatArguments,
      })
      .returning();

    if (result.length === 0) {
      throw new PotgDBError("Failed to insert popo chat reservation");
    }

    const insertedReservation = result[0];
    return this.resultToPopoChatReservationEntity(insertedReservation);
  }

  /*
  SELECT * FROM popo_chat_reservation
  WHERE send_after <= $1
  ORDER BY send_after ASC, pk ASC;
  -- $1은 호출 시점의 현재 시각입니다.
   */
  async findAllReadyToSend(): Promise<PopoChatReservationEntity[]> {
    return this.findAllScheduledBefore(new Date());
  }

  /*
  SELECT * FROM popo_chat_reservation
  WHERE send_after <= $1
  ORDER BY send_after ASC, pk ASC;
   */
  async findAllScheduledBefore(
    until: Date,
  ): Promise<PopoChatReservationEntity[]> {
    const results = await this.dbService.db
      .select({
        pk: popoChatReservation.pk,
        potFk: popoChatReservation.potFk,
        popoChatMsgType: popoChatReservation.popoChatMsgType,
        sendAfter: popoChatReservation.sendAfter,
        createdAt: popoChatReservation.createdAt,
        updatedAt: popoChatReservation.updatedAt,
        formatArguments: popoChatReservation.formatArguments,
      })
      .from(popoChatReservation)
      .where(lte(popoChatReservation.sendAfter, until))
      .orderBy(asc(popoChatReservation.sendAfter), asc(popoChatReservation.pk));

    return results.map((result) =>
      this.resultToPopoChatReservationEntity(result),
    );
  }

  /*
  SELECT * FROM popo_chat_reservation WHERE pk = $1;
   */
  async findByPk(
    pk: string,
    tx?: TxType,
  ): Promise<PopoChatReservationEntity | null> {
    const [row] = await (tx ?? this.dbService.db)
      .select()
      .from(popoChatReservation)
      .where(eq(popoChatReservation.pk, pk));
    return row ? this.resultToPopoChatReservationEntity(row) : null;
  }

  /*
  SELECT * FROM popo_chat_reservation WHERE pk = $1
  FOR UPDATE SKIP LOCKED;
   */
  async findByPkForUpdate(
    pk: string,
    tx: TxType,
  ): Promise<PopoChatReservationEntity | null> {
    const [row] = await tx
      .select()
      .from(popoChatReservation)
      .where(eq(popoChatReservation.pk, pk))
      .for("update", { skipLocked: true });
    return row ? this.resultToPopoChatReservationEntity(row) : null;
  }

  /*
  DELETE FROM popo_chat_reservation
    WHERE pk = ?1
   */
  async deleteByPk(pk: string, tx: TxType): Promise<void> {
    await tx.delete(popoChatReservation).where(eq(popoChatReservation.pk, pk));
  }

  /*
  DELETE FROM popo_chat_reservation
    WHERE pot_fk = ?1
    AND popo_chat_msg_type = ?2
   */
  async deleteByPotFkAndType(
    potFk: string,
    type: PopoChatStringType,
    tx: TxType,
  ): Promise<void> {
    await tx
      .delete(popoChatReservation)
      .where(
        and(
          eq(popoChatReservation.potFk, potFk),
          eq(popoChatReservation.popoChatMsgType, type),
        ),
      );
  }

  /*
  DELETE FROM popo_chat_reservation
    WHERE pot_fk = ?1
   */
  async deleteByPotFk(potFk: string, tx: TxType): Promise<void> {
    await tx
      .delete(popoChatReservation)
      .where(eq(popoChatReservation.potFk, potFk));
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
      formatArguments: result.formatArguments,
    };
  }
}
