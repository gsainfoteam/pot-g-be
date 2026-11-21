import { Injectable } from "@nestjs/common";
import { asc, eq, lte } from "drizzle-orm";
import { DatabaseService } from "@src/database/database.service";
import { TxType } from "@src/global/types/tx.types";
import { popoChatDelivery } from "../../../drizzle/schema/popo-chat-delivery";

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
      .where(lte(popoChatDelivery.nextAttemptAt, new Date()))
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

  /*
  DELETE FROM popo_chat_delivery WHERE pk = $1;
   */
  async deleteByPk(pk: string, tx: TxType) {
    await tx.delete(popoChatDelivery).where(eq(popoChatDelivery.pk, pk));
  }

  /*
  UPDATE popo_chat_delivery SET next_attempt_at = $1 WHERE pk = $2;
   */
  async retryLater(pk: string, nextAttemptAt: Date, tx: TxType) {
    await tx
      .update(popoChatDelivery)
      .set({ nextAttemptAt })
      .where(eq(popoChatDelivery.pk, pk));
  }
}
