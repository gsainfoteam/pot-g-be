import type { FofoChatStringType } from "../../drizzle/schema/fofo-chat-msg";

// Historical JSON payloads retain their original label after the DB enum rename.
export type StoredFofoChatType =
  | FofoChatStringType
  | "popo-delay-check-request-v1";

export function isDelayCheckChatType(type: string | undefined): boolean {
  return (
    type === "fofo-delay-check-request-v1" ||
    type === "popo-delay-check-request-v1"
  );
}
