import { Injectable } from "@nestjs/common";
import { DatabaseService } from "@src/database/database.service";
import { PotRoomEntity } from "@src/database/entity/pot-room.entity";
import { TxType } from "@src/global/types/tx.types";
import { potRoom } from "../../../drizzle/schema/pot-room";
import { and, asc, eq, gte, lte, not, sql } from "drizzle-orm";
import { userPotRoom } from "../../../drizzle/schema/user-pot-room";
import { users } from "../../../drizzle/schema/users";
import {
  potEvent,
  PotEventStringType,
} from "../../../drizzle/schema/pot-event";
import { Pot } from "@src/pot/model/pot";
import { PotEventReducer } from "@src/pot/event/pot-event-reducer";
import { PotEventFactory } from "@src/pot/event/pot-event";
import { PotgDBError } from "@src/global/exceptions/potg-db.error";
import { QueryTimeLogWriter } from "@src/database/query.time.log.writer";
import { LoggerService } from "@src/global/logger/logger.service";

@Injectable()
export class PotRoomRepository {
  private readonly queryTimeLogWriter: QueryTimeLogWriter;

  constructor(
    private readonly dbService: DatabaseService,
    private readonly loggerService: LoggerService,
  ) {
    this.queryTimeLogWriter = new QueryTimeLogWriter(loggerService);
  }

  async insert(
    potRoomEntity: PotRoomEntity,
    tx: TxType,
  ): Promise<PotRoomEntity | null> {
    const result = await tx
      .insert(potRoom)
      .values({
        pk: potRoomEntity.pk,
        routeFk: potRoomEntity.routeFk,
        isArchived: potRoomEntity.isArchived,
        isDeleted: potRoomEntity.isDeleted,
        isDepartureConfirmed: potRoomEntity.isDepartureConfirmed,
        maxCapacity: potRoomEntity.maxCapacity,
        startsAt: potRoomEntity.startsAt,
        endsAt: potRoomEntity.endsAt,
        createdAt: potRoomEntity.createdAt,
        updatedAt: potRoomEntity.updatedAt,
        name: potRoomEntity.name,
      })
      .returning();

    if (result.length === 0) {
      throw new PotgDBError("Failed to insert pot room");
    }

    return this.resultToPotRoomEntity(result[0]);
  }

  /*
  SELECT pr.*, count(upr.user_fk) as current_user_count
  FROM pot_room as pr
    LEFT JOIN user_pot_room as upr ON pr.pk = upr.pot_room_fk
  WHERE pr.route_fk = ?1       // optional
    AND pr.is_archived = false
    AND pr.is_deleted = false
    AND pr.is_departure_confirmed = false
    AND pr.ends_at >= ?2       // optional
    AND pr.starts_at <= ?3     // optional
  GROUP BY pr.pk               // for count()
  ORDER BY pr.starts_at ASC
  OFFSET ?4 LIMIT ?5;
   */
  async searchPotList(
    offset: number,
    limit: number,
    route_id?: string,
    starts_at?: Date,
    ends_at?: Date,
  ): Promise<PotRoomEntity[]> {
    this.queryTimeLogWriter.startTimer();
    const results = await this.dbService.db
      .select({
        pk: potRoom.pk,
        routeFk: potRoom.routeFk,
        isArchived: potRoom.isArchived,
        isDeleted: potRoom.isDeleted,
        isDepartureConfirmed: potRoom.isDepartureConfirmed,
        maxCapacity: potRoom.maxCapacity,
        currentUserCount: sql<number>`cast(count(${userPotRoom.userFk}) as int)`,
        startsAt: potRoom.startsAt,
        endsAt: potRoom.endsAt,
        createdAt: potRoom.createdAt,
        updatedAt: potRoom.updatedAt,
        name: potRoom.name,
      })
      .from(potRoom)
      .leftJoin(userPotRoom, eq(potRoom.pk, userPotRoom.potRoomFk))
      .where(this.getSearchPotListWhereClause(route_id, starts_at, ends_at))
      .groupBy(potRoom.pk)
      .offset(offset * limit)
      .limit(limit)
      .orderBy(asc(potRoom.startsAt));

    const result = results.map((result) => this.resultToPotRoomEntity(result));
    this.queryTimeLogWriter.write('searchPotList');
    this.queryTimeLogWriter.resetTimer();
    return result;
  }

  /*
  SELECT count(*)
  FROM pot_room
  WHERE route_fk = ?1      // optional
    AND is_archived = false
    AND is_deleted = false
    AND pr.is_departure_confirmed = false
    AND ends_at >= ?2       // optional
    AND starts_at <= ?3     // optional
   */
  async countPotList(
    route_id?: string,
    starts_at?: Date,
    ends_at?: Date,
  ): Promise<number> {
    return await this.dbService.db.$count(
      potRoom,
      this.getSearchPotListWhereClause(route_id, starts_at, ends_at),
    );
  }

  /*
  UPDATE pot_room
  SET is_departure_confirmed = true,
      updated_at = NOW()
  WHERE pk = ?1;
   */
  async setDepartureTime(potRoomPk: string, tx: TxType): Promise<void> {
    await tx
      .update(potRoom)
      .set({
        isDepartureConfirmed: true,
        updatedAt: new Date(),
      })
      .where(eq(potRoom.pk, potRoomPk));
  }

  /*
  UPDATE pot_room
  SET is_archived = true,
      updated_at = NOW()
  WHERE pk = ?1;
   */
  async archivePotRoom(potRoomPk: string, tx: TxType): Promise<void> {
    await tx
      .update(potRoom)
      .set({
        isArchived: true,
        updatedAt: new Date(),
      })
      .where(eq(potRoom.pk, potRoomPk));
  }

  /*
  // 쿼리 순서는 의도적으로 user -> user_pot_room -> pot_room -> pot_event
  SELECT pr.*, pe.*
  FROM users as u
    INNER JOIN user_pot_room as upr ON u.pk = upr.user_fk
    INNER JOIN pot_room as pr ON upr.pot_room_fk = pr.pk
    INNER JOIN pot_event as pe ON pr.pk = pe.pot_fk
  WHERE u.pk = ?1
    AND pr.is_deleted = false
    AND pe.type != ?2 // exclude 'chat' type
  GROUP BY pr.pk, pe.pot_fk, pe.timestamp
  ORDER BY pe.timestamp ASC
   */
  async getUserPotRoomList(
    userPk: string,
    chatEventType: PotEventStringType,
  ): Promise<PotRoomEntity[]> {
    this.queryTimeLogWriter.startTimer();
    const results = await this.dbService.db
      .select({
        pk: potRoom.pk,
        routeFk: potRoom.routeFk,
        isArchived: potRoom.isArchived,
        isDeleted: potRoom.isDeleted,
        isDepartureConfirmed: potRoom.isDepartureConfirmed,
        maxCapacity: potRoom.maxCapacity,
        startsAt: potRoom.startsAt,
        endsAt: potRoom.endsAt,
        createdAt: potRoom.createdAt,
        updatedAt: potRoom.updatedAt,
        name: potRoom.name,
        // PotEvent fields
        potFk: potEvent.potFk,
        timestamp: potEvent.timestamp,
        id: potEvent.id,
        type: potEvent.type,
        data: potEvent.data,
      })
      .from(users)
      .innerJoin(userPotRoom, eq(users.pk, userPotRoom.userFk))
      .innerJoin(potRoom, eq(userPotRoom.potRoomFk, potRoom.pk))
      .innerJoin(potEvent, eq(potRoom.pk, potEvent.potFk))
      .where(
        and(
          eq(users.pk, userPk),
          eq(potRoom.isDeleted, false),
          // Exclude 'chat' type events
          not(eq(potEvent.type, chatEventType)),
        ),
      )
      .groupBy(potRoom.pk, potEvent.potFk, potEvent.timestamp, potEvent.id)
      .orderBy(asc(potEvent.timestamp));

    this.queryTimeLogWriter.write('getUserPotRoomList');
    // 타입 체크를 위해 따로 함수로 분리하지 않습니다. (분리할 경우 타입 명시 해줘야 해서 코드가 더러워짐)
    const result = results.reduce((acc, curr) => {
      const potEvent = PotEventFactory.toModel(curr);

      // find existing PotRoomEntity in acc
      const existing = acc.find((item) => item.pk === curr.pk);
      if (existing) {
        PotEventReducer.reduce(existing.pot, potEvent);
      } else {
        // create new PotRoomEntity and reduce
        const newEntity = this.resultToPotRoomEntity(curr);
        newEntity.pot = new Pot();

        PotEventReducer.reduce(newEntity.pot, potEvent);
        acc.push(newEntity);
      }
      return acc;
    }, [] as PotRoomEntity[]);
    this.queryTimeLogWriter.resetTimer();
    return result;
  }

  /*
  SELECT pr.*, pe.*
  FROM pot_room as pr
    INNER JOIN pot_event as pe ON pr.pk = pe.pot_fk
  WHERE pr.pk = ?1
    AND pr.is_deleted = false
    AND pe.type != ?2 // exclude 'chat' type
  GROUP BY pe.pot_fk, pe.timestamp
  ORDER BY pe.timestamp ASC
   */
  async getPotRoomInfoByPk(
    potPk: string,
    chatEventType: PotEventStringType,
  ): Promise<PotRoomEntity | null> {
    const results = await this.dbService.db
      .select({
        pk: potRoom.pk,
        routeFk: potRoom.routeFk,
        isArchived: potRoom.isArchived,
        isDeleted: potRoom.isDeleted,
        isDepartureConfirmed: potRoom.isDepartureConfirmed,
        maxCapacity: potRoom.maxCapacity,
        startsAt: potRoom.startsAt,
        endsAt: potRoom.endsAt,
        createdAt: potRoom.createdAt,
        updatedAt: potRoom.updatedAt,
        name: potRoom.name,
        // PotEvent fields
        potFk: potEvent.potFk,
        timestamp: potEvent.timestamp,
        id: potEvent.id,
        type: potEvent.type,
        data: potEvent.data,
      })
      .from(potRoom)
      .innerJoin(potEvent, eq(potRoom.pk, potEvent.potFk))
      .where(
        and(
          eq(potRoom.pk, potPk),
          eq(potRoom.isDeleted, false),
          // Exclude 'chat' type events
          not(eq(potEvent.type, chatEventType)),
        ),
      )
      .groupBy(potRoom.pk, potEvent.potFk, potEvent.timestamp, potEvent.id)
      .orderBy(asc(potEvent.timestamp));

    if (results.length === 0) {
      return null;
    }

    const potRoomEntity = this.resultToPotRoomEntity(results[0]);
    potRoomEntity.pot = new Pot();

    results.forEach((result) => {
      const potEvent = PotEventFactory.toModel(result);
      PotEventReducer.reduce(potRoomEntity.pot, potEvent);
    });

    return potRoomEntity;
  }

  private getSearchPotListWhereClause(
    route_id?: string,
    starts_at?: Date,
    ends_at?: Date,
  ) {
    return and(
      route_id ? eq(potRoom.routeFk, route_id) : undefined,
      eq(potRoom.isArchived, false),
      eq(potRoom.isDeleted, false),
      eq(potRoom.isDepartureConfirmed, false),
      starts_at ? gte(potRoom.endsAt, starts_at) : undefined,
      ends_at ? lte(potRoom.startsAt, ends_at) : undefined,
    );
  }

  private resultToPotRoomEntity(result: any): PotRoomEntity {
    return {
      pk: result.pk,
      routeFk: result.routeFk,
      isArchived: result.isArchived,
      isDeleted: result.isDeleted,
      isDepartureConfirmed: result.isDepartureConfirmed,
      maxCapacity: result.maxCapacity,
      currentUserCount: result.currentUserCount,
      startsAt: result.startsAt,
      endsAt: result.endsAt,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
      name: result.name,
    };
  }
}
