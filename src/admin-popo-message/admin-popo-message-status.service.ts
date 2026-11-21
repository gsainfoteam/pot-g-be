import { Injectable } from "@nestjs/common";
import * as format from "string-format";
import { Trace } from "@gsainfoteam/nest-observability";
import {
  PopoChatStatusAdminRepository,
  PopoSentRow,
} from "@src/admin-database/repository/popo-chat-status.admin.repository";
import { POPO_MESSAGE_META } from "@src/popo/popo-message-meta";
import {
  PopoReservationDto,
  PopoReservationListResDto,
  PopoSentDto,
  PopoSentListResDto,
  PopoStatusListReqDto,
} from "@src/admin-popo-message/dto/popo-message-status.dto";

@Trace()
@Injectable()
export class AdminPopoMessageStatusService {
  constructor(
    private readonly statusRepository: PopoChatStatusAdminRepository,
  ) {}

  async listReservations(
    req: PopoStatusListReqDto,
  ): Promise<PopoReservationListResDto> {
    const [rows, total] = await Promise.all([
      this.statusRepository.findReservations(req.page, req.size),
      this.statusRepository.countReservations(),
    ]);
    const now = Date.now();

    const items: PopoReservationDto[] = rows.map((row) => ({
      pk: row.pk,
      pot_pk: row.potPk,
      pot_name: row.potName,
      type: row.type,
      title: POPO_MESSAGE_META[row.type].title,
      send_after: row.sendAfter.toISOString(),
      created_at: row.createdAt.toISOString(),
      status: row.sendAfter.getTime() <= now ? "overdue" : "scheduled",
    }));

    return { items, total, page: req.page, size: req.size };
  }

  async listSent(req: PopoStatusListReqDto): Promise<PopoSentListResDto> {
    const [rows, total] = await Promise.all([
      this.statusRepository.findSent(req.page, req.size),
      this.statusRepository.countSent(),
    ]);

    return {
      items: rows.map((row) => this.toSentDto(row)),
      total,
      page: req.page,
      size: req.size,
    };
  }

  private toSentDto(row: PopoSentRow): PopoSentDto {
    const { popoChatType, message, formatArguments, actionBtns } = row.data;
    return {
      event_id: row.eventId,
      pot_pk: row.potPk,
      pot_name: row.potName,
      type: popoChatType,
      title: POPO_MESSAGE_META[popoChatType]?.title ?? popoChatType,
      content: this.formatContent(message, formatArguments),
      action_btns: actionBtns,
      sent_at: row.sentAt.toISOString(),
    };
  }

  /** An old event may not format with its arguments; show the raw template instead of failing the list. */
  private formatContent(message: string, formatArguments: unknown): string {
    try {
      return format(message, formatArguments);
    } catch {
      return message;
    }
  }
}
