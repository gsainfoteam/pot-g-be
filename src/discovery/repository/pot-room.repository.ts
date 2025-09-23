import { Injectable } from "@nestjs/common";
import { DatabaseService } from "@src/database/database.service";
import { PotRoomEntity } from "@src/discovery/model/pot-room.entity";
import { TxType } from "@src/global/types/tx.types";
import { potRoom } from "../../../drizzle/schema/pot-room";
import { and, asc, eq, gte, lte, sql } from "drizzle-orm";
import { userPotRoom } from "../../../drizzle/schema/user-pot-room";

@Injectable()
export class PotRoomRepository {
  constructor(private readonly dbService: DatabaseService) {}

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
      throw new Error("Failed to insert pot room"); // TODO
    }

    return this.resultToPotRoomEntity(result[0]);
  }

  /*
  SELECT pr.*, count(upr.user_fk) as current_user_count
  FROM pot_room as pr
    LEFT JOIN user_pot_room as upr ON pr.pk = upr.pot_room_fk
  WHERE pr.route_fk = ?1      // optional
    AND pr.is_archived = false
    AND pr.is_deleted = false
    AND pr.starts_at >= ?2    // optional
    AND pr.ends_at <= ?3      // optional
  ORDER BY pr.created_at ASC
  LIMIT ?5 OFFSET ?4;
   */
  async searchPotList(
    offset: number,
    limit: number,
    route_id?: string,
    starts_at?: Date,
    ends_at?: Date,
  ): Promise<PotRoomEntity[]> {
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
      .orderBy(asc(potRoom.createdAt));

    return results.map((result) => this.resultToPotRoomEntity(result));
  }

  /*
  SELECT count(*)
  FROM pot_room
  WHERE route_fk = ?1      // optional
    AND is_archived = false
    AND is_deleted = false
    AND starts_at >= ?2    // optional
    AND ends_at <= ?3;     // optional
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

  private getSearchPotListWhereClause(
    route_id?: string,
    starts_at?: Date,
    ends_at?: Date,
  ) {
    return and(
      route_id ? eq(potRoom.routeFk, route_id) : undefined,
      eq(potRoom.isArchived, false),
      eq(potRoom.isDeleted, false),
      starts_at ? gte(potRoom.startsAt, starts_at) : undefined,
      ends_at ? lte(potRoom.endsAt, ends_at) : undefined,
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
