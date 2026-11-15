import { PotEventAccountingConfirmV1Dto } from "./pot-event.accounting-confirm.v1.dto";
import { PotEventAccountingRequestV1Dto } from "./pot-event.accounting-request.v1.dto";
import { PotEventArchiveV1Dto } from "./pot-event.archive.v1.dto";
import { PotEventChatV1Dto } from "./pot-event.chat.v1.dto";
import { PotEventCreateV1Dto } from "./pot-event.create.v1.dto";
import { PotEventDepartureConfirmV1Dto } from "./pot-event.departure-confirm.v1.dto";
import { PotEventPopoChatV1Dto } from "./pot-event.popo-chat.v1.dto";
import { PotEventUserInV1Dto } from "./pot-event.user-in.v1.dto";
import { PotEventUserKickV1Dto } from "./pot-event.user-kick.v1.dto";
import { PotEventUserLeaveV1Dto } from "./pot-event.user-leave.v1.dto";
import { ApiProperty, ApiExtraModels, getSchemaPath } from "@nestjs/swagger";
@ApiExtraModels(
  PotEventAccountingConfirmV1Dto,
  PotEventAccountingRequestV1Dto,
  PotEventArchiveV1Dto,
  PotEventChatV1Dto,
  PotEventCreateV1Dto,
  PotEventDepartureConfirmV1Dto,
  PotEventPopoChatV1Dto,
  PotEventUserInV1Dto,
  PotEventUserKickV1Dto,
  PotEventUserLeaveV1Dto,
)
export class PotEventDto<T> {
  @ApiProperty({ type: String })
  pot_pk: string;
  @ApiProperty({
    type: Number,
    description: "Unix timestamp (초)",
    example: 1794589200,
  })
  timestamp: number;
  @ApiProperty({ type: Number })
  id: number;
  @ApiProperty({
    enum: [
      "create_v1",
      "chat_v1",
      "popo_chat_v1",
      "user_in_v1",
      "user_leave_v1",
      "user_kick_v1",
      "departure_confirm_v1",
      "accounting_request_v1",
      "accounting_confirm_v1",
      "archive_v1",
    ],
  })
  event_type: string;
  @ApiProperty({
    anyOf: [
      { $ref: getSchemaPath(PotEventAccountingConfirmV1Dto) },
      { $ref: getSchemaPath(PotEventAccountingRequestV1Dto) },
      { $ref: getSchemaPath(PotEventArchiveV1Dto) },
      { $ref: getSchemaPath(PotEventChatV1Dto) },
      { $ref: getSchemaPath(PotEventCreateV1Dto) },
      { $ref: getSchemaPath(PotEventDepartureConfirmV1Dto) },
      { $ref: getSchemaPath(PotEventPopoChatV1Dto) },
      { $ref: getSchemaPath(PotEventUserInV1Dto) },
      { $ref: getSchemaPath(PotEventUserKickV1Dto) },
      { $ref: getSchemaPath(PotEventUserLeaveV1Dto) },
    ],
    description:
      "event_type에 해당하는 v1 이벤트 payload. archive_v1과 accounting_confirm_v1은 빈 객체입니다.",
  })
  data: T;
}
