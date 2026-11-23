import { FofoActionBtnStringType } from "../../../../../drizzle/schema/fofo-chat-msg";
import { StoredFofoChatType } from "@src/fofo/fofo-chat-type";

export class PotEventPopoChatV1Dto {
  // Existing mobile clients consume this v1 payload key.
  popo_chat_type: StoredFofoChatType;
  content: string;
  action_btns: FofoActionBtnStringType[];
}
