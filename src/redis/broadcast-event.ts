import { PotEventStringType } from "../../drizzle/schema/pot-event";

export type BroadcastEvent = {
  eventType: PotEventStringType;
  targetUserId: string; // 대상 유저의 ID
  timestamp: number; // 이벤트 발생 시간 (Unix timestamp)
  data: any;
};
