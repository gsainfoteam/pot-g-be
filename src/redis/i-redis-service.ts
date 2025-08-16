import { BroadcastEvent } from "@src/redis/broadcast-event";
import { UserWsConnectionStatus } from "@src/user/user-ws-connection-status";

export interface IRedisService {
  broadcastEvent(broadcastEvent: BroadcastEvent): Promise<void>;
  broadcastEvents(broadcastEvents: BroadcastEvent[]): Promise<void>;
  setWsConnectionStatus(
    userId: string,
    status: UserWsConnectionStatus,
  ): Promise<void>;
  getWsConnectionStatus(userId: string): Promise<UserWsConnectionStatus>;
}

export const REDIS_SERVICE_TOKEN = Symbol("IRedisService");
