import { Injectable } from "@nestjs/common";
import { DatabaseService } from "@src/database/database.service";
import { popoChatMsg } from "../../../drizzle/schema/popo-chat-msg";
import { PopoChatMsgEntity } from "@src/database/entity/popo-chat-msg.entity";

@Injectable()
export class PopoChatMsgRepository {
  constructor(private readonly dbService: DatabaseService) {}

  /*
  SELECT * from popo_chat_msg
   */
  async findAll(): Promise<PopoChatMsgEntity[]> {
    const results = await this.dbService.db
      .select({
        type: popoChatMsg.type,
        actionBtns: popoChatMsg.actionBtns,
        message: popoChatMsg.message,
      })
      .from(popoChatMsg);

    return results.map((result) => this.resultToPopoChatMsgEntity(result));
  }

  private resultToPopoChatMsgEntity(result: any): PopoChatMsgEntity {
    return {
      type: result.type,
      actionBtns: result.actionBtns,
      message: result.message,
    };
  }
}
