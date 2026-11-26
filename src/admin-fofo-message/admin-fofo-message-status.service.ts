import { Injectable } from "@nestjs/common";
import * as format from "string-format";
import { Trace } from "@gsainfoteam/nest-observability";
import {
  FofoChatStatusAdminRepository,
  FofoSentRow,
} from "@src/admin-database/repository/fofo-chat-status.admin.repository";
import { FOFO_MESSAGE_META } from "@src/fofo/fofo-message-meta";
import { isDelayCheckChatType } from "@src/fofo/fofo-chat-type";
import {
  FofoReservationDto,
  FofoReservationListResDto,
  FofoSentDto,
  FofoSentListResDto,
  FofoStatusListReqDto,
} from "@src/admin-fofo-message/dto/fofo-message-status.dto";

@Trace()
@Injectable()
export class AdminFofoMessageStatusService {
  constructor(
    private readonly statusRepository: FofoChatStatusAdminRepository,
  ) {}

  async listReservations(
    req: FofoStatusListReqDto,
  ): Promise<FofoReservationListResDto> {
    const [rows, total] = await Promise.all([
      this.statusRepository.findReservations(req.page, req.size),
      this.statusRepository.countReservations(),
    ]);
    const now = Date.now();

    const items: FofoReservationDto[] = rows.map((row) => ({
      pk: row.pk,
      pot_pk: row.potPk,
      pot_name: row.potName,
      type: row.type,
      title: FOFO_MESSAGE_META[row.type].title,
      send_after: row.sendAfter.toISOString(),
      created_at: row.createdAt.toISOString(),
      status: row.sendAfter.getTime() <= now ? "overdue" : "scheduled",
    }));

    return { items, total, page: req.page, size: req.size };
  }

  async listSent(req: FofoStatusListReqDto): Promise<FofoSentListResDto> {
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

  private toSentDto(row: FofoSentRow): FofoSentDto {
    const { popoChatType, message, formatArguments, actionBtns } = row.data;
    const metadataType = isDelayCheckChatType(popoChatType)
      ? "fofo-delay-check-request-v1"
      : popoChatType;
    return {
      event_id: row.eventId,
      pot_pk: row.potPk,
      pot_name: row.potName,
      type: popoChatType,
      title: FOFO_MESSAGE_META[metadataType]?.title ?? popoChatType,
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
