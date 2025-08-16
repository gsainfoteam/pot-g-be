import { Injectable, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Redis from "ioredis";
import { IRedisService } from "@src/redis/i-redis-service";
import { BroadcastEvent } from "@src/redis/broadcast-event";
import { UserWsConnectionStatus } from "@src/user/user-ws-connection-status";

@Injectable()
export class RedisService implements OnModuleInit, OnModuleInit, IRedisService {
  private readonly redisHost: string;
  private readonly redisPort: number;
  private readonly redisClient: Redis;
  private readonly redisEventSubscriber: Redis;

  private eventQueue: string[] = []; // Queue to hold events

  private static readonly BROADCAST_EVENT_KEY = "event:broadcast";
  private static readonly WS_CONNECTION_STATUS_KEY_PREFIX =
    "ws:connection_status";

  constructor(private readonly configService: ConfigService) {
    this.redisHost =
      this.configService.get<string>("REDIS_HOST") || "localhost";
    this.redisPort = this.configService.get<number>("REDIS_PORT") || 6379;

    this.redisClient = new Redis({
      host: this.redisHost,
      port: this.redisPort,
    });
    this.redisEventSubscriber = new Redis({
      host: this.redisHost,
      port: this.redisPort,
    });
  }

  onModuleInit() {
    this.redisEventSubscriber.on(
      "event",
      (channel: string, message: string) => {
        // Handle the event message here
        console.log(`Received message from channel ${channel}: ${message}`);
        this.eventQueue.push(message); // Add message to the queue
      },
    );
  }

  async onModuleDestroy() {
    if (this.redisClient) {
      await this.redisClient.quit();
    }
    if (this.redisEventSubscriber) {
      await this.redisEventSubscriber.quit();
    }
    console.log("Redis connections closed."); // TODO use logger

    // Sleep until all events in the queue are processed
    while (this.eventQueue.length > 0) {
      await new Promise((resolve) => setTimeout(resolve, 100)); // Wait for 100ms
    }
  }

  private async handleEvents(): Promise<void> {
    const events = this.eventQueue;
    this.eventQueue = []; // Clear the queue immediately

    for (const event of events) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const broadcastEvent: BroadcastEvent = JSON.parse(event);
        // This could cause performance issues if the event processing is slow.
        // Let's handle this issue later.
        await this.handleBroadcastEvent(broadcastEvent);
      } catch (e) {
        console.error(e);
      }
    }
  }

  private async handleBroadcastEvent(
    broadcastEvent: BroadcastEvent,
  ): Promise<void> {
    // Check if the targetUserId is connected with this server: TODO
    if (false) {
      return;
    }

    // broadcast the message to the target user
    return;
  }

  async broadcastEvent(broadcastEvent: BroadcastEvent): Promise<void> {
    const eventString = JSON.stringify(broadcastEvent);
    // Publish the event to the Redis channel
    await this.redisClient.lpush(RedisService.BROADCAST_EVENT_KEY, eventString);
  }

  async broadcastEvents(broadcastEvents: BroadcastEvent[]): Promise<void> {
    const eventStrings = broadcastEvents.map((event) => JSON.stringify(event));
    // Publish the events to the Redis channel
    await this.redisClient.lpush(
      RedisService.BROADCAST_EVENT_KEY,
      ...eventStrings,
    );
  }

  async setWsConnectionStatus(
    userId: string,
    status: UserWsConnectionStatus,
  ): Promise<void> {
    const key = `${RedisService.WS_CONNECTION_STATUS_KEY_PREFIX}:${userId}`;
    await this.redisClient.set(key, status);
  }

  async getWsConnectionStatus(userId: string): Promise<UserWsConnectionStatus> {
    const key = `${RedisService.WS_CONNECTION_STATUS_KEY_PREFIX}:${userId}`;
    const status = await this.redisClient.get(key);
    if (status === null) {
      return UserWsConnectionStatus.NOT_CONNECTED;
    }
    return status as UserWsConnectionStatus;
  }
}
