import { Injectable } from "@nestjs/common";
import { DatabaseService } from "@src/database/database.service";
import { FofoChatReservationEntity } from "@src/database/entity/fofo-chat-reservation.entity";
import { TxType } from "@src/global/types/tx.types";
import { fofoChatReservation } from "../../../drizzle/schema/fofo-chat-reservation";
import { randomUUID } from "node:crypto";
import { and, asc, eq, lte } from "drizzle-orm";
import { FofoChatStringType } from "../../../drizzle/schema/fofo-chat-msg";
import { PotgDBError } from "@src/global/exceptions/potg-db.error";

@Injectable()
export class FofoChatReservationRepository {
  constructor(private readonly dbService: DatabaseService) {}

  /*
  INSERT INTO fofo_chat_reservation
    (pk, pot_fk, fofo_chat_msg_type, send_after, created_at, updated_at, format_arguments)
  VALUES ($1, $2, $3, $4, $5, $6, $7)
  RETURNING *;
   */
  async insert(
    fofoChatReservationEntity: FofoChatReservationEntity,
    tx: TxType,
  ): Promise<FofoChatReservationEntity> {
    const result = await tx
      .insert(fofoChatReservation)
      .values({
        pk: fofoChatReservationEntity.pk || randomUUID(),
        potFk: fofoChatReservationEntity.potFk,
        fofoChatMsgType: fofoChatReservationEntity.fofoChatMsgType,
        sendAfter: fofoChatReservationEntity.sendAfter,
        createdAt: fofoChatReservationEntity.createdAt,
        updatedAt: fofoChatReservationEntity.updatedAt,
        formatArguments: fofoChatReservationEntity.formatArguments,
      })
      .returning();

    if (result.length === 0) {
      throw new PotgDBError("Failed to insert fofo chat reservation");
    }

    const insertedReservation = result[0];
    return this.resultToFofoChatReservationEntity(insertedReservation);
  }

  /*
  SELECT * FROM fofo_chat_reservation
  WHERE send_after <= $1
  ORDER BY send_after ASC, pk ASC;
  -- $1은 호출 시점의 현재 시각입니다.
   */
  async findAllReadyToSend(): Promise<FofoChatReservationEntity[]> {
    return this.findAllScheduledBefore(new Date());
  }

  /*
  SELECT * FROM fofo_chat_reservation
  WHERE send_after <= $1
  ORDER BY send_after ASC, pk ASC;
   */
  async findAllScheduledBefore(
    until: Date,
  ): Promise<FofoChatReservationEntity[]> {
    const results = await this.dbService.db
      .select({
        pk: fofoChatReservation.pk,
        potFk: fofoChatReservation.potFk,
        fofoChatMsgType: fofoChatReservation.fofoChatMsgType,
        sendAfter: fofoChatReservation.sendAfter,
        createdAt: fofoChatReservation.createdAt,
        updatedAt: fofoChatReservation.updatedAt,
        formatArguments: fofoChatReservation.formatArguments,
      })
      .from(fofoChatReservation)
      .where(lte(fofoChatReservation.sendAfter, until))
      .orderBy(asc(fofoChatReservation.sendAfter), asc(fofoChatReservation.pk));

    return results.map((result) =>
      this.resultToFofoChatReservationEntity(result),
    );
  }

  /*
  SELECT * FROM fofo_chat_reservation WHERE pk = $1;
   */
  async findByPk(
    pk: string,
    tx?: TxType,
  ): Promise<FofoChatReservationEntity | null> {
    const [row] = await (tx ?? this.dbService.db)
      .select()
      .from(fofoChatReservation)
      .where(eq(fofoChatReservation.pk, pk));
    return row ? this.resultToFofoChatReservationEntity(row) : null;
  }

  /*
  SELECT * FROM fofo_chat_reservation WHERE pk = $1
  FOR UPDATE SKIP LOCKED;
   */
  async findByPkForUpdate(
    pk: string,
    tx: TxType,
  ): Promise<FofoChatReservationEntity | null> {
    const [row] = await tx
      .select()
      .from(fofoChatReservation)
      .where(eq(fofoChatReservation.pk, pk))
      .for("update", { skipLocked: true });
    return row ? this.resultToFofoChatReservationEntity(row) : null;
  }

  /*
  DELETE FROM fofo_chat_reservation
    WHERE pk = ?1
   */
  async deleteByPk(pk: string, tx: TxType): Promise<void> {
    await tx.delete(fofoChatReservation).where(eq(fofoChatReservation.pk, pk));
  }

  /*
  DELETE FROM fofo_chat_reservation
    WHERE pot_fk = ?1
    AND fofo_chat_msg_type = ?2
   */
  async deleteByPotFkAndType(
    potFk: string,
    type: FofoChatStringType,
    tx: TxType,
  ): Promise<void> {
    await tx
      .delete(fofoChatReservation)
      .where(
        and(
          eq(fofoChatReservation.potFk, potFk),
          eq(fofoChatReservation.fofoChatMsgType, type),
        ),
      );
  }

  /*
  DELETE FROM fofo_chat_reservation
    WHERE pot_fk = ?1
   */
  async deleteByPotFk(potFk: string, tx: TxType): Promise<void> {
    await tx
      .delete(fofoChatReservation)
      .where(eq(fofoChatReservation.potFk, potFk));
  }

  private resultToFofoChatReservationEntity(
    result: any,
  ): FofoChatReservationEntity {
    return {
      pk: result.pk,
      potFk: result.potFk,
      fofoChatMsgType: result.fofoChatMsgType,
      sendAfter: result.sendAfter,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
      formatArguments: result.formatArguments,
    };
  }
}
