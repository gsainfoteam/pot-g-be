import {
  FofoActionBtnStringType,
  FofoChatStringType,
} from "../../../../../drizzle/schema/fofo-chat-msg";

export class PotEventFofoChatV1Dto {
  // Existing mobile clients consume this v1 payload key.
  popo_chat_type: FofoChatStringType;
  content: string;
  action_btns: FofoActionBtnStringType[];
}
