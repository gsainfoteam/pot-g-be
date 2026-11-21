import { Injectable } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { DatabaseService } from "@src/database/database.service";
import { adminChatViewLog } from "../../../drizzle/schema/admin-chat-view-log";

/**
 * 어드민이 팟 채팅을 열람한 기록을 남기는 레포지토리입니다.
 */
@Injectable()
export class AdminChatViewLogRepository {
  constructor(private readonly dbService: DatabaseService) {}

  /*
  INSERT INTO admin_chat_view_log (pk, pot_room_fk, admin_email)
    VALUES (?1, ?2, ?3);
   */
  async insert(potPk: string, adminEmail: string): Promise<void> {
    await this.dbService.db.insert(adminChatViewLog).values({
      pk: randomUUID(),
      potRoomFk: potPk,
      adminEmail,
    });
  }
}
