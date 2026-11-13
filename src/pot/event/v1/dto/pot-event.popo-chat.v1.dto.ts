import { ApiProperty } from "@nestjs/swagger";
import {
  PopoActionBtnStringType,
  PopoChatStringType,
} from "../../../../../drizzle/schema/popo-chat-msg";

export class PotEventPopoChatV1Dto {
  @ApiProperty({
    enum: [
      "popo-departure-confirm-request-v1",
      "popo-departure-confirmed-v1",
      "popo-reminder-taxi-call-v1",
      "popo-accounting-reminder-v1",
      "popo-accounting-request-v1",
      "popo-auto-archive-no-departure-confirm-v1",
      "popo-auto-archive-accounting-fin-v1",
      "popo-auto-archive-v1",
    ],
  })
  popo_chat_type: PopoChatStringType;
  @ApiProperty({ type: String })
  content: string;
  @ApiProperty({
    enum: [
      "departure-confirm-btn",
      "taxi-call-btn",
      "accounting-request-btn",
      "accounting-info-check-btn",
      "accounting-process-btn",
    ],
    isArray: true,
  })
  action_btns: PopoActionBtnStringType[];
}
