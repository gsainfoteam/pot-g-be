import { DatabaseService } from "@src/database/database.service";
import { Pot } from "../model/pot";
import { PotEvent, PotEventFactory } from "../event/pot-event";
import { potEvent } from "drizzle/schema/pot-event";
import { and, asc, eq, not, SQL, sql } from "drizzle-orm";
import { PotEventReducer } from "../event/pot-event-reducer";
import { Injectable } from "@nestjs/common";

type DataCondition = { eventType: string; data: Record<string, any> };

@Injectable()
export class PotRoomRepository {
  constructor(private readonly db: DatabaseService) {}

  async saveEvent<T>(event: PotEvent<T>): Promise<PotEvent<T>> {
    const result = await this.db.db
      .insert(potEvent)
      .values(PotEventFactory.toEntity(event))
      .returning();

    return PotEventFactory.toModel(result[0]);
  }

  /*
  SELECT * FROM pot_event
    WHERE pot_fk = 'potPk'
    AND type != 'chat_v1'
    ORDER BY timestamp ASC;
   */
  async findByIdWithoutChat(potPk: string): Promise<Pot> {
    const result = await this.db.db
      .select()
      .from(potEvent)
      .where(and(eq(potEvent.potFk, potPk), not(eq(potEvent.type, "chat_v1"))))
      .orderBy(asc(potEvent.timestamp));

    const potEvents = result.map((event) => PotEventFactory.toModel(event));

    return PotEventReducer.reduceFromInitial(potEvents);
  }

  async findById(roomId: string): Promise<Pot> {
    const result = await this.findEventsByCondition({
      potPks: [roomId],
      dataConditions: [],
    });
    return PotEventReducer.reduceFromInitial(result);
  }

  private async findEventsByCondition(params: {
    potPks?: string[];
    dataConditions: DataCondition[];
  }): Promise<PotEvent<any>[]> {
    const conditions: SQL[] = [];

    if (params.potPks && params.potPks.length > 0) {
      conditions.push(sql`${potEvent.potFk} = ANY(${params.potPks})`);
    }

    if (params.dataConditions.length > 0) {
      const eventConditions = this.dataConditionsToSQL(params.dataConditions);
      conditions.push(sql`(${sql.join(eventConditions, " OR ")})`);
    }

    const result = await this.db.db
      .select()
      .from(potEvent)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(asc(potEvent.timestamp));

    return result.map((event) => PotEventFactory.toModel(event));
  }

  private dataConditionsToSQL(dataConditions: DataCondition[]): SQL[] {
    return dataConditions.map(({ eventType, data }) => {
      const dataConditions = Object.entries(data).map(([k, v]) => {
        if (typeof v === "string" && v.startsWith("[") && v.endsWith("]")) {
          return sql`${potEvent.data}::jsonb @> ${v}::jsonb`;
        }
        return sql`${potEvent.data}->>'${k}' = ${v}`;
      });
      return sql`(${potEvent.type} = ${eventType} AND ${and(...dataConditions)})`;
    });
  }
}
