import { Injectable } from "@nestjs/common";
import { asc, count, desc, eq } from "drizzle-orm";
import { DatabaseService } from "@src/database/database.service";
import { popoChatReservation } from "../../../drizzle/schema/popo-chat-reservation";
import { potEvent } from "../../../drizzle/schema/pot-event";
import { potRoom } from "../../../drizzle/schema/pot-room";
import { PopoChatStringType } from "../../../drizzle/schema/popo-chat-msg";
import { PotPopoChatEventV1Schema } from "@src/pot/event/v1/pot-popo-chat-event";

export type PopoReservationRow = {
  pk: string;
  potPk: string;
  potName: string;
  type: PopoChatStringType;
  sendAfter: Date;
  createdAt: Date;
};

export type PopoSentRow = {
  potPk: string;
  eventId: number;
  potName: string;
  sentAt: Date;
  data: PotPopoChatEventV1Schema;
};

/**
 * 어드민 페이지 전용 포포 메시지 예약/발송 현황 조회 레포지토리입니다. 읽기 전용입니다.
 */
@Injectable()
export class PopoChatStatusAdminRepository {
  constructor(private readonly dbService: DatabaseService) {}

  /*
  SELECT r.pk, r.pot_fk, p.name, r.popo_chat_msg_type, r.send_after, r.created_at
  FROM popo_chat_reservation r
  JOIN pot_room p ON p.pk = r.pot_fk
  ORDER BY r.send_after ASC, r.pk ASC
  LIMIT ?1 OFFSET ?2;
   */
  async findReservations(
    page: number,
    size: number,
  ): Promise<PopoReservationRow[]> {
    return this.dbService.db
      .select({
        pk: popoChatReservation.pk,
        potPk: popoChatReservation.potFk,
        potName: potRoom.name,
        type: popoChatReservation.popoChatMsgType,
        sendAfter: popoChatReservation.sendAfter,
        createdAt: popoChatReservation.createdAt,
      })
      .from(popoChatReservation)
      .innerJoin(potRoom, eq(potRoom.pk, popoChatReservation.potFk))
      .orderBy(asc(popoChatReservation.sendAfter), asc(popoChatReservation.pk))
      .limit(size)
      .offset(page * size);
  }

  /*
  SELECT COUNT(*) FROM popo_chat_reservation;
   */
  async countReservations(): Promise<number> {
    const [row] = await this.dbService.db
      .select({ total: count() })
      .from(popoChatReservation);
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
  async findSent(page: number, size: number): Promise<PopoSentRow[]> {
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
      data: row.data as PotPopoChatEventV1Schema,
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
