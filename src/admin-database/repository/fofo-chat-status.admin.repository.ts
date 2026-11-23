import { Injectable } from "@nestjs/common";
import { asc, count, desc, eq } from "drizzle-orm";
import { DatabaseService } from "@src/database/database.service";
import { fofoChatReservation } from "../../../drizzle/schema/fofo-chat-reservation";
import { potEvent } from "../../../drizzle/schema/pot-event";
import { potRoom } from "../../../drizzle/schema/pot-room";
import { FofoChatStringType } from "../../../drizzle/schema/fofo-chat-msg";
import { PotFofoChatEventV1Schema } from "@src/pot/event/v1/pot-fofo-chat-event";

export type FofoReservationRow = {
  pk: string;
  potPk: string;
  potName: string;
  type: FofoChatStringType;
  sendAfter: Date;
  createdAt: Date;
};

export type FofoSentRow = {
  potPk: string;
  eventId: number;
  potName: string;
  sentAt: Date;
  data: PotFofoChatEventV1Schema;
};

/**
 * 어드민 페이지 전용 포포 메시지 예약/발송 현황 조회 레포지토리입니다. 읽기 전용입니다.
 */
@Injectable()
export class FofoChatStatusAdminRepository {
  constructor(private readonly dbService: DatabaseService) {}

  /*
  SELECT r.pk, r.pot_fk, p.name, r.fofo_chat_msg_type, r.send_after, r.created_at
  FROM fofo_chat_reservation r
  JOIN pot_room p ON p.pk = r.pot_fk
  ORDER BY r.send_after ASC, r.pk ASC
  LIMIT ?1 OFFSET ?2;
   */
  async findReservations(
    page: number,
    size: number,
  ): Promise<FofoReservationRow[]> {
    return this.dbService.db
      .select({
        pk: fofoChatReservation.pk,
        potPk: fofoChatReservation.potFk,
        potName: potRoom.name,
        type: fofoChatReservation.fofoChatMsgType,
        sendAfter: fofoChatReservation.sendAfter,
        createdAt: fofoChatReservation.createdAt,
      })
      .from(fofoChatReservation)
      .innerJoin(potRoom, eq(potRoom.pk, fofoChatReservation.potFk))
      .orderBy(asc(fofoChatReservation.sendAfter), asc(fofoChatReservation.pk))
      .limit(size)
      .offset(page * size);
  }

  /*
  SELECT COUNT(*) FROM fofo_chat_reservation;
   */
  async countReservations(): Promise<number> {
    const [row] = await this.dbService.db
      .select({ total: count() })
      .from(fofoChatReservation);
    return row.total;
  }

  /*
  SELECT e.pot_fk, e.id, p.name, e.timestamp, e.data
  FROM pot_event e
  JOIN pot_room p ON p.pk = e.pot_fk
  WHERE e.type = 'popo_chat_v1'
  ORDER BY e.timestamp DESC, e.id DESC
  LIMIT ?1 OFFSET ?2;
   */
  async findSent(page: number, size: number): Promise<FofoSentRow[]> {
    const rows = await this.dbService.db
      .select({
        potPk: potEvent.potFk,
        eventId: potEvent.id,
        potName: potRoom.name,
        sentAt: potEvent.timestamp,
        data: potEvent.data,
      })
      .from(potEvent)
      .innerJoin(potRoom, eq(potRoom.pk, potEvent.potFk))
      .where(eq(potEvent.type, "popo_chat_v1"))
      .orderBy(desc(potEvent.timestamp), desc(potEvent.id))
      .limit(size)
      .offset(page * size);

    return rows.map((row) => ({
      ...row,
      data: row.data as PotFofoChatEventV1Schema,
    }));
  }

  /*
  SELECT COUNT(*) FROM pot_event WHERE type = 'popo_chat_v1';
   */
  async countSent(): Promise<number> {
    const [row] = await this.dbService.db
      .select({ total: count() })
      .from(potEvent)
      .where(eq(potEvent.type, "popo_chat_v1"));
    return row.total;
  }
}
