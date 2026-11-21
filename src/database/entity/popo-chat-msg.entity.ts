import {
  PopoActionBtnStringType,
  PopoChatStringType,
} from "../../../drizzle/schema/popo-chat-msg";

export class PopoChatMsgEntity {
  type: PopoChatStringType;
  actionBtns: PopoActionBtnStringType[];
  message: string;
  enabled: boolean;
  /** 기준 시각 대비 발송 시점(분). 음수 = 전, 양수 = 후, null = 이벤트 발생 즉시 발송 */
  offsetMinutes: number | null;
  updatedAt: Date;
}
