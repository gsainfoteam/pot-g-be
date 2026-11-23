import { Injectable } from "@nestjs/common";
import { DatabaseService } from "@src/database/database.service";
import { fofoChatMsg } from "../../../drizzle/schema/fofo-chat-msg";
import { FofoChatMsgEntity } from "@src/database/entity/fofo-chat-msg.entity";

@Injectable()
export class FofoChatMsgRepository {
  constructor(private readonly dbService: DatabaseService) {}

  /*
  SELECT * from fofo_chat_msg
   */
  async findAll(): Promise<FofoChatMsgEntity[]> {
    const results = await this.dbService.db
      .select({
        type: fofoChatMsg.type,
        actionBtns: fofoChatMsg.actionBtns,
        message: fofoChatMsg.message,
      })
      .from(fofoChatMsg);

    return results.map((result) => this.resultToFofoChatMsgEntity(result));
  }

  private resultToFofoChatMsgEntity(result: any): FofoChatMsgEntity {
    return {
      type: result.type,
      actionBtns: result.actionBtns,
      message: result.message,
    };
  }
}
