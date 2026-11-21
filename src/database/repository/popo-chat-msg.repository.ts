import { Injectable } from "@nestjs/common";
import { eq } from "drizzle-orm";
import { DatabaseService } from "@src/database/database.service";
import {
  popoChatMsg,
  PopoChatStringType,
} from "../../../drizzle/schema/popo-chat-msg";
import { PopoChatMsgEntity } from "@src/database/entity/popo-chat-msg.entity";
import { TxType } from "@src/global/types/tx.types";

@Injectable()
export class PopoChatMsgRepository {
  constructor(private readonly dbService: DatabaseService) {}

  /*
  SELECT * from popo_chat_msg
   */
  async findAll(): Promise<PopoChatMsgEntity[]> {
    const results = await this.dbService.db.select().from(popoChatMsg);

    return results.map((result) => this.resultToPopoChatMsgEntity(result));
  }

  /*
  SELECT * from popo_chat_msg WHERE type = ?1
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

    return this.resultToPopoChatMsgEntity(results[0]);
  }

  private resultToPopoChatMsgEntity(
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
