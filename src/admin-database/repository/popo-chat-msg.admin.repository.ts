import { Injectable } from "@nestjs/common";
import { eq } from "drizzle-orm";
import { DatabaseService } from "@src/database/database.service";
import { PopoChatMsgEntity } from "@src/database/entity/popo-chat-msg.entity";
import { TxType } from "@src/global/types/tx.types";
import {
  popoChatMsg,
  PopoChatStringType,
} from "../../../drizzle/schema/popo-chat-msg";
import { PotgDBError } from "@src/global/exceptions/potg-db.error";

@Injectable()
export class PopoChatMsgAdminRepository {
  constructor(private readonly dbService: DatabaseService) {}

  /*
  SELECT * FROM popo_chat_msg;
   */
  async findAll(): Promise<PopoChatMsgEntity[]> {
    const results = await this.dbService.db.select().from(popoChatMsg);

    return results.map((result) => this.resultToEntity(result));
  }

  /*
  SELECT * FROM popo_chat_msg WHERE type = ?1;
   */
  async findByType(
    type: PopoChatStringType,
    tx?: TxType,
  ): Promise<PopoChatMsgEntity | null> {
    const db = tx ? tx : this.dbService.db;

    const results = await db
      .select()
      .from(popoChatMsg)
      .where(eq(popoChatMsg.type, type));

    if (results.length === 0) {
      return null;
    }

    return this.resultToEntity(results[0]);
  }

  /*
  UPDATE popo_chat_msg
  SET message = ?2, enabled = ?3, offset_minutes = ?4, updated_at = ?5
  WHERE type = ?1
  RETURNING *;
   */
  async update(
    entity: PopoChatMsgEntity,
    tx: TxType,
  ): Promise<PopoChatMsgEntity> {
    const results = await tx
      .update(popoChatMsg)
      .set({
        message: entity.message,
        enabled: entity.enabled,
        offsetMinutes: entity.offsetMinutes,
        updatedAt: entity.updatedAt,
      })
      .where(eq(popoChatMsg.type, entity.type))
      .returning();

    if (results.length === 0) {
      throw new PotgDBError("Failed to update popo chat msg");
    }

    return this.resultToEntity(results[0]);
  }

  private resultToEntity(
    result: typeof popoChatMsg.$inferSelect,
  ): PopoChatMsgEntity {
    return {
      type: result.type,
      actionBtns: result.actionBtns,
      message: result.message,
      enabled: result.enabled,
      offsetMinutes: result.offsetMinutes,
      updatedAt: result.updatedAt,
    };
  }
}
