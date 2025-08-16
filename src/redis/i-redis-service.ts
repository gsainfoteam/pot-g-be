import { BroadcastEvent } from "@src/redis/broadcast-event";
import { UserWsConnectionStatus } from "@src/user/user-ws-connection-status";

export interface IRedisService {
  broadcastEvent(broadcastEvent: BroadcastEvent): void;
  setWsConnectionStatus(userId: string): void;
  getWsConnectionStatus(userId: string): UserWsConnectionStatus;
}
