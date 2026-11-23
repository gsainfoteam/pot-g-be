import { Injectable } from "@nestjs/common";
import { eq } from "drizzle-orm";
import { DatabaseService } from "@src/database/database.service";
import { FofoChatMsgEntity } from "@src/database/entity/fofo-chat-msg.entity";
import { TxType } from "@src/global/types/tx.types";
import {
  fofoChatMsg,
  FofoChatStringType,
} from "../../../drizzle/schema/fofo-chat-msg";
import { PotgDBError } from "@src/global/exceptions/potg-db.error";

@Injectable()
export class FofoChatMsgAdminRepository {
  constructor(private readonly dbService: DatabaseService) {}

  /*
  SELECT * FROM fofo_chat_msg;
   */
  async findAll(): Promise<FofoChatMsgEntity[]> {
    const results = await this.dbService.db.select().from(fofoChatMsg);

    return results.map((result) => this.resultToEntity(result));
  }

  /*
  SELECT * FROM fofo_chat_msg WHERE type = ?1;
   */
  async findByType(
    type: FofoChatStringType,
    tx?: TxType,
  ): Promise<FofoChatMsgEntity | null> {
    const db = tx ? tx : this.dbService.db;

    const results = await db
      .select()
      .from(fofoChatMsg)
      .where(eq(fofoChatMsg.type, type));

    if (results.length === 0) {
      return null;
    }

    return this.resultToEntity(results[0]);
  }

  /*
  UPDATE fofo_chat_msg
  SET message = ?2, enabled = ?3, offset_minutes = ?4, updated_at = ?5
  WHERE type = ?1
  RETURNING *;
   */
  async update(
    entity: FofoChatMsgEntity,
    tx: TxType,
  ): Promise<FofoChatMsgEntity> {
    const results = await tx
      .update(fofoChatMsg)
      .set({
        message: entity.message,
        enabled: entity.enabled,
        offsetMinutes: entity.offsetMinutes,
        updatedAt: entity.updatedAt,
      })
      .where(eq(fofoChatMsg.type, entity.type))
      .returning();

    if (results.length === 0) {
      throw new PotgDBError("Failed to update fofo chat msg");
    }

    return this.resultToEntity(results[0]);
  }

  private resultToEntity(
    result: typeof fofoChatMsg.$inferSelect,
  ): FofoChatMsgEntity {
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
