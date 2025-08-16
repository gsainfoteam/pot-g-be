import { PotEventStringType } from "../../drizzle/schema/pot-event";

export type BroadcastEvent = {
  eventType: PotEventStringType;
  targetUserId: string; // 대상 유저의 ID
  data: any;
};
