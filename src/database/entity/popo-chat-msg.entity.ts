import {
  PopoActionBtnStringType,
  PopoChatStringType,
} from "../../../drizzle/schema/popo-chat-msg";

export class PopoChatMsgEntity {
  type: PopoChatStringType;
  actionBtns: PopoActionBtnStringType[];
  message: string;
}
