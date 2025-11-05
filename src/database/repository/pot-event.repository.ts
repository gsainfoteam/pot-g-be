import { DatabaseService } from "@src/database/database.service";
import { Pot } from "@src/pot/model/pot";
import { PotEvent, PotEventFactory } from "@src/pot/event/pot-event";
import { potEvent } from "../../../drizzle/schema/pot-event";
import { and, asc, eq, lte, not, SQL, sql } from "drizzle-orm";
import { PotEventReducer } from "@src/pot/event/pot-event-reducer";
import { Injectable } from "@nestjs/common";
import { TxType } from "@src/global/types/tx.types";
import { desc } from "drizzle-orm/sql/expressions/select";
import { PotgDBError } from "@src/global/exceptions/potg-db.error";

type DataCondition = { eventType: string; data: Record<string, any> };

@Injectable()
export class PotEventRepository {
  constructor(private readonly db: DatabaseService) {}

  async saveEvent<S, D>(event: PotEvent<S, D>, tx: TxType) {
    const result = await tx
      .insert(potEvent)
      .values(PotEventFactory.toEntity(event))
      .returning();

    if (result.length === 0) {
      throw new PotgDBError("Failed to insert pot event");
    }
    event.id = result[0].id;
  }

  /*
  SELECT * FROM pot_event
    WHERE pot_fk = ?1
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

  /*
  SELECT * FROM pot_event
    WHERE pot_fk = ?1
      AND timestamp <= ?2
    ORDER BY timestamp DESC
    LIMIT ?3;
   */
  async getEventsByPotPkWithLimit(
    potPk: string,
    before: Date,
    limit: number,
  ): Promise<PotEvent<any, any>[]> {
    const result = await this.db.db
      .select()
      .from(potEvent)
      .where(and(eq(potEvent.potFk, potPk), lte(potEvent.timestamp, before)))
      .orderBy(desc(potEvent.timestamp))
      .limit(limit);

    return result.map((event) => PotEventFactory.toModel(event));
  }

  private async findEventsByCondition(params: {
    potPks?: string[];
    dataConditions: DataCondition[];
  }): Promise<PotEvent<any, any>[]> {
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
