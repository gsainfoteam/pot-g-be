import { Injectable } from "@nestjs/common";
import { and, asc, eq, isNull, lte, or } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { DatabaseService } from "@src/database/database.service";
import { TxType } from "@src/global/types/tx.types";
import {
  DeliveryProgress,
  fofoChatDelivery,
} from "../../../drizzle/schema/fofo-chat-delivery";

export type FofoChatDelivery = typeof fofoChatDelivery.$inferSelect;

@Injectable()
export class FofoChatDeliveryRepository {
  constructor(private readonly dbService: DatabaseService) {}

  /*
  INSERT INTO fofo_chat_delivery
    (pk, pot_fk, events, user_pks, pot_name, next_attempt_at, created_at)
  VALUES ($1, $2, $3, $4, $5, $6, $7);
  -- 시각을 전달하지 않으면 각각 DEFAULT를 사용합니다.
   */
  async insert(delivery: typeof fofoChatDelivery.$inferInsert, tx: TxType) {
    await tx.insert(fofoChatDelivery).values(delivery);
  }

  /*
  SELECT * FROM fofo_chat_delivery
  WHERE next_attempt_at <= $1
  ORDER BY created_at ASC, pk ASC;
   */
  async findReady(): Promise<FofoChatDelivery[]> {
    return this.dbService.db
      .select()
      .from(fofoChatDelivery)
      .where(
        and(
          lte(fofoChatDelivery.nextAttemptAt, new Date()),
          or(
            isNull(fofoChatDelivery.leaseUntil),
            lte(fofoChatDelivery.leaseUntil, new Date()),
          ),
        ),
      )
      .orderBy(asc(fofoChatDelivery.createdAt), asc(fofoChatDelivery.pk));
  }

  /*
  SELECT * FROM fofo_chat_delivery WHERE pk = $1
  FOR UPDATE SKIP LOCKED;
   */
  async findByPkForUpdate(
    pk: string,
    tx: TxType,
  ): Promise<FofoChatDelivery | undefined> {
    const [delivery] = await tx
      .select()
      .from(fofoChatDelivery)
      .where(eq(fofoChatDelivery.pk, pk))
      .for("update", { skipLocked: true });
    return delivery;
  }

  // Claim in a short transaction; never hold a connection during network I/O.
  async claim(pk: string): Promise<FofoChatDelivery | undefined> {
    return this.dbService.db.transaction(async (tx) => {
      const delivery = await this.findByPkForUpdate(pk, tx);
      const now = new Date();
      if (
        !delivery ||
        delivery.nextAttemptAt > now ||
        delivery.leaseUntil > now
      )
        return undefined;
      const [claimed] = await tx
        .update(fofoChatDelivery)
        .set({
          leaseToken: randomUUID(),
          leaseUntil: new Date(Date.now() + 5 * 60_000),
        })
        .where(eq(fofoChatDelivery.pk, pk))
        .returning();
      return claimed;
    });
  }

  async saveProgress(
    pk: string,
    leaseToken: string,
    progress: DeliveryProgress,
  ) {
    const updated = await this.dbService.db
      .update(fofoChatDelivery)
      .set({
        progress,
        leaseUntil: new Date(Date.now() + 5 * 60_000),
      })
      .where(
        and(
          eq(fofoChatDelivery.pk, pk),
          eq(fofoChatDelivery.leaseToken, leaseToken),
        ),
      )
      .returning({ pk: fofoChatDelivery.pk });
    if (!updated.length) throw new Error("Reserved delivery lease lost");
  }

  async finishAttempt(pk: string, leaseToken: string, nextAttemptAt?: Date) {
    const condition = and(
      eq(fofoChatDelivery.pk, pk),
      eq(fofoChatDelivery.leaseToken, leaseToken),
    );
    if (nextAttemptAt) {
      await this.dbService.db
        .update(fofoChatDelivery)
        .set({
          nextAttemptAt,
          leaseToken: null,
          leaseUntil: null,
        })
        .where(condition);
    } else {
      await this.dbService.db.delete(fofoChatDelivery).where(condition);
    }
  }
}
