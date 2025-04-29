import { DatabaseService } from "@src/database/database.service";
import { Room } from "../model/room";
import { RoomEvent, RoomEventFactory } from "../event/room-event";
import { roomEvent } from "drizzle/schema/room-event";
import { and, eq, asc, or, gt, lt, SQL, inArray } from "drizzle-orm";
import { RoomReducer } from "../event/room-reducer";

export class RoomRepository {
  constructor(private readonly db: DatabaseService) {}

  async saveEvent<T>(room: Room, event: RoomEvent<T>): Promise<RoomEvent<T>> {
    const entity = RoomEventFactory.toEntity(room, event);
    const result = await this.db.db
      .insert(roomEvent)
      .values(entity)
      .returning();
    return RoomEventFactory.toModel(result[0]);
  }

  async findById(roomId: string): Promise<Room> {
    const result = await this.findEventsByCondition(roomId);
    return new RoomReducer().reduceAll(new Room(), result);
  }

  private async findEventsByCondition(
    roomId?: string,
    eventTypes?: string[],
  ): Promise<RoomEvent<any>[]> {
    const conditions: SQL[] = [];

    if (roomId) {
      conditions.push(eq(roomEvent.roomId, roomId));
    }

    if (eventTypes) {
      conditions.push(inArray(roomEvent.eventType, eventTypes));
    }

    const result = await this.db.db
      .select()
      .from(roomEvent)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(asc(roomEvent.timestamp));

    return result.map((event) => RoomEventFactory.toModel(event));
  }
}
