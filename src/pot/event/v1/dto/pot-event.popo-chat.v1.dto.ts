import {
  PopoActionBtnStringType,
  PopoChatStringType,
} from "../../../../../drizzle/schema/popo-chat-msg";

export class PotEventPopoChatV1Dto {
  popo_chat_type: PopoChatStringType;
  content: string;
  action_btns: PopoActionBtnStringType[];
}
