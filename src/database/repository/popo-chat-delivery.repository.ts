import { Injectable } from "@nestjs/common";
import { and, asc, eq, isNull, lte, or } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { DatabaseService } from "@src/database/database.service";
import { TxType } from "@src/global/types/tx.types";
import {
  DeliveryProgress,
  popoChatDelivery,
} from "../../../drizzle/schema/popo-chat-delivery";

export type PopoChatDelivery = typeof popoChatDelivery.$inferSelect;

@Injectable()
export class PopoChatDeliveryRepository {
  constructor(private readonly dbService: DatabaseService) {}

  /*
  INSERT INTO popo_chat_delivery
    (pk, pot_fk, events, user_pks, pot_name, next_attempt_at, created_at)
  VALUES ($1, $2, $3, $4, $5, $6, $7);
  -- 시각을 전달하지 않으면 각각 DEFAULT를 사용합니다.
   */
  async insert(delivery: typeof popoChatDelivery.$inferInsert, tx: TxType) {
    await tx.insert(popoChatDelivery).values(delivery);
  }

  /*
  SELECT * FROM popo_chat_delivery
  WHERE next_attempt_at <= $1
  ORDER BY created_at ASC, pk ASC;
   */
  async findReady(): Promise<PopoChatDelivery[]> {
    return this.dbService.db
      .select()
      .from(popoChatDelivery)
      .where(
        and(
          lte(popoChatDelivery.nextAttemptAt, new Date()),
          or(
            isNull(popoChatDelivery.leaseUntil),
            lte(popoChatDelivery.leaseUntil, new Date()),
          ),
        ),
      )
      .orderBy(asc(popoChatDelivery.createdAt), asc(popoChatDelivery.pk));
  }

  /*
  SELECT * FROM popo_chat_delivery WHERE pk = $1
  FOR UPDATE SKIP LOCKED;
   */
  async findByPkForUpdate(
    pk: string,
    tx: TxType,
  ): Promise<PopoChatDelivery | undefined> {
    const [delivery] = await tx
      .select()
      .from(popoChatDelivery)
      .where(eq(popoChatDelivery.pk, pk))
      .for("update", { skipLocked: true });
    return delivery;
  }

  // Claim in a short transaction; never hold a connection during network I/O.
  async claim(pk: string): Promise<PopoChatDelivery | undefined> {
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
        .update(popoChatDelivery)
        .set({
          leaseToken: randomUUID(),
          leaseUntil: new Date(Date.now() + 5 * 60_000),
        })
        .where(eq(popoChatDelivery.pk, pk))
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
      .update(popoChatDelivery)
      .set({
        progress,
        leaseUntil: new Date(Date.now() + 5 * 60_000),
      })
      .where(
        and(
          eq(popoChatDelivery.pk, pk),
          eq(popoChatDelivery.leaseToken, leaseToken),
        ),
      )
      .returning({ pk: popoChatDelivery.pk });
    if (!updated.length) throw new Error("Reserved delivery lease lost");
  }

  async finishAttempt(pk: string, leaseToken: string, nextAttemptAt?: Date) {
    const condition = and(
      eq(popoChatDelivery.pk, pk),
      eq(popoChatDelivery.leaseToken, leaseToken),
    );
    if (nextAttemptAt) {
      await this.dbService.db
        .update(popoChatDelivery)
        .set({
          nextAttemptAt,
          leaseToken: null,
          leaseUntil: null,
        })
        .where(condition);
    } else {
      await this.dbService.db.delete(popoChatDelivery).where(condition);
    }
  }
}
