import { Injectable } from "@nestjs/common";
import { eq } from "drizzle-orm";
import { DatabaseService } from "@src/database/database.service";
import {
  fofoChatMsg,
  FofoChatStringType,
} from "@drizzle-schema/fofo-chat-msg";
import { FofoChatMsgEntity } from "@src/database/entity/fofo-chat-msg.entity";
import { TxType } from "@src/global/types/tx.types";

@Injectable()
export class FofoChatMsgRepository {
  constructor(private readonly dbService: DatabaseService) {}

  /*
  SELECT * from fofo_chat_msg
   */
  async findAll(): Promise<FofoChatMsgEntity[]> {
    const results = await this.dbService.db.select().from(fofoChatMsg);

    return results.map((result) => this.resultToFofoChatMsgEntity(result));
  }

  /*
  SELECT * from fofo_chat_msg WHERE type = ?1
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

    return this.resultToFofoChatMsgEntity(results[0]);
  }

  private resultToFofoChatMsgEntity(
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
