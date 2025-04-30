import { DatabaseService } from "@src/database/database.service";
import { Room } from "../model/room";
import { RoomEvent, RoomEventFactory } from "../event/room-event";
import { roomEvent } from "drizzle/schema/room-event";
import { and, asc, SQL, sql } from "drizzle-orm";
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
    const result = await this.findEventsByCondition({
      roomIds: [roomId],
      dataConditions: [],
    });
    return new RoomReducer().reduceAll(new Room(), result);
  }

  private async findEventsByCondition(params: {
    roomIds?: string[];
    dataConditions: { eventType: string; data: Record<string, any> }[];
  }): Promise<RoomEvent<any>[]> {
    const conditions: SQL[] = [];

    if (params.roomIds && params.roomIds.length > 0) {
      conditions.push(sql`${roomEvent.roomId} = ANY(${params.roomIds})`);
    }

    if (params.dataConditions.length > 0) {
      const eventConditions = params.dataConditions.map(
        ({ eventType, data }) => {
          const dataConditions = Object.entries(data).map(([k, v]) => {
            if (typeof v === "string" && v.startsWith("[") && v.endsWith("]")) {
              return sql`${roomEvent.data}::jsonb @> ${v}::jsonb`;
            }
            return sql`${roomEvent.data}->>'${k}' = ${v}`;
          });
          return sql`(${roomEvent.eventType} = ${eventType} AND ${and(...dataConditions)})`;
        },
      );
      conditions.push(sql`(${sql.join(eventConditions, " OR ")})`);
    }

    const result = await this.db.db
      .select()
      .from(roomEvent)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(asc(roomEvent.timestamp));

    return result.map((event) => RoomEventFactory.toModel(event));
  }
}
