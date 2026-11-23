import {
  FofoActionBtnStringType,
  FofoChatStringType,
} from "../../../drizzle/schema/fofo-chat-msg";

export class FofoChatMsgEntity {
  type: FofoChatStringType;
  actionBtns: FofoActionBtnStringType[];
  message: string;
}
