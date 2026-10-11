import { Injectable } from "@nestjs/common";
import { and, asc, eq, not } from "drizzle-orm";
import { DatabaseService } from "@src/database/database.service";
import { PotEvent, PotEventFactory } from "@src/pot/event/pot-event";
import { potEvent } from "../../../drizzle/schema/pot-event";

/**
 * 어드민 페이지 전용 pot_event 조회 레포지토리입니다.
 * 기존 PotEventRepository 와 분리되어 있어, 서비스 로직에는 영향을 주지 않습니다.
 */
@Injectable()
export class PotEventAdminRepository {
  constructor(private readonly dbService: DatabaseService) {}

  /*
  SELECT * FROM pot_event
    WHERE pot_fk = ?1
      AND type != 'chat_v1'
    ORDER BY timestamp ASC, id ASC;
   */
  async findEventsWithoutChat(potPk: string): Promise<PotEvent<any, any>[]> {
    const result = await this.dbService.db
      .select()
      .from(potEvent)
      .where(and(eq(potEvent.potFk, potPk), not(eq(potEvent.type, "chat_v1"))))
      .orderBy(asc(potEvent.timestamp), asc(potEvent.id));

    return result.map((event) => PotEventFactory.toModel(event));
  }
}
