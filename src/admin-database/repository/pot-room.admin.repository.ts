import { Injectable } from "@nestjs/common";
import { and, asc, desc, eq, ilike, or, sql } from "drizzle-orm";
import { DatabaseService } from "@src/database/database.service";
import { PotRoomAdminEntity } from "@src/admin-database/entity/pot-room.admin.entity";
import { potRoom } from "../../../drizzle/schema/pot-room";
import { userPotRoom } from "../../../drizzle/schema/user-pot-room";

/**
 * 어드민 페이지 전용 pot_room 조회 레포지토리입니다.
 * 기존 PotRoomRepository 와 분리되어 있어, 서비스 로직에는 영향을 주지 않습니다.
 */
@Injectable()
export class PotRoomAdminRepository {
  constructor(private readonly dbService: DatabaseService) {}

  /*
  SELECT pr.*, count(upr.user_fk) as current_user_count,
         (SELECT (pe.data->>'departureTime')::timestamptz FROM pot_event as pe
           WHERE pe.pot_fk = pr.pk AND pe.type = 'departure_confirm_v1'
           ORDER BY pe.timestamp DESC LIMIT 1) as departure_time
  FROM pot_room as pr
    LEFT JOIN user_pot_room as upr ON pr.pk = upr.pot_room_fk
  WHERE (pr.name ILIKE ?1 OR pr.pk::text ILIKE ?1)  // search 가 있는 경우에만
    AND pr.is_archived = false   // activeOnly 또는 overdueBefore 가 있는 경우에만
    AND pr.is_deleted = false    // activeOnly 또는 overdueBefore 가 있는 경우에만
    AND COALESCE(departure_time, pr.ends_at) < ?2  // overdueBefore 가 있는 경우에만
  GROUP BY pr.pk
  ORDER BY pr.starts_at DESC
  OFFSET ?3 LIMIT ?4;            // page 가 있는 경우에만
   */
  async findAllWithDeparture(params: {
    search?: string;
    activeOnly?: boolean; // 해산/삭제되지 않은 팟만
    overdueBefore?: Date; // 예정 출발 시간이 이 시각보다 이전인 팟만 (해산/삭제되지 않은 팟)
    page?: number;
    size?: number;
  }): Promise<PotRoomAdminEntity[]> {
    const departureTime = this.departureTimeSubquery();

    const query = this.dbService.db
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
        departureTime,
      })
      .from(potRoom)
      .leftJoin(userPotRoom, eq(potRoom.pk, userPotRoom.potRoomFk))
      .where(
        and(
          this.getAdminSearchClause(params.search),
          params.activeOnly || params.overdueBefore
            ? and(eq(potRoom.isArchived, false), eq(potRoom.isDeleted, false))
            : undefined,
          params.overdueBefore
            ? sql`COALESCE(${departureTime}, ${potRoom.endsAt}) < ${params.overdueBefore.toISOString()}::timestamptz`
            : undefined,
        ),
      )
      .groupBy(potRoom.pk)
      // 같은 startsAt 이 있어도 페이지 사이에서 순서가 흔들리지 않도록 pk 로 한 번 더 정렬합니다.
      .orderBy(desc(potRoom.startsAt), asc(potRoom.pk))
      .$dynamic();

    const results =
      params.page !== undefined && params.size !== undefined
        ? await query.offset(params.page * params.size).limit(params.size)
        : await query;

    return results.map((result) => ({
      ...this.resultToPotRoomEntity(result),
      departureTime: result.departureTime
        ? new Date(result.departureTime)
        : null,
    }));
  }

  /*
  SELECT count(*) FROM pot_room as pr
  WHERE (pr.name ILIKE ?1 OR pr.pk::text ILIKE ?1)  // search 가 있는 경우에만
    AND pr.is_archived = false                      // activeOnly 인 경우에만
    AND pr.is_deleted = false;                      // activeOnly 인 경우에만
   */
  async countForAdmin(params: {
    search?: string;
    activeOnly?: boolean;
  }): Promise<number> {
    return await this.dbService.db.$count(
      potRoom,
      and(
        this.getAdminSearchClause(params.search),
        params.activeOnly
          ? and(eq(potRoom.isArchived, false), eq(potRoom.isDeleted, false))
          : undefined,
      ),
    );
  }

  private departureTimeSubquery() {
    return sql<
      string | null
    >`(SELECT (pe.data->>'departureTime')::timestamptz FROM pot_event AS pe WHERE pe.pot_fk = ${potRoom.pk} AND pe.type = 'departure_confirm_v1' ORDER BY pe.timestamp DESC LIMIT 1)`;
  }

  // 팟 이름 또는 pk 에 검색어가 포함된 경우. LIKE 의 와일드카드 문자는 이스케이프 합니다.
  private getAdminSearchClause(search?: string) {
    const keyword = search?.trim();
    if (!keyword) return undefined;

    const pattern = `%${keyword.replace(/[\\%_]/g, "\\$&")}%`;
    return or(
      ilike(potRoom.name, pattern),
      sql`${potRoom.pk}::text ILIKE ${pattern}`,
    );
  }

  /*
  SELECT * FROM pot_room WHERE pk = ?1;
   */
  async findByPk(potPk: string): Promise<PotRoomAdminEntity | null> {
    const results = await this.dbService.db
      .select()
      .from(potRoom)
      .where(eq(potRoom.pk, potPk));

    if (results.length === 0) {
      return null;
    }

    return this.resultToPotRoomEntity(results[0]);
  }

  private resultToPotRoomEntity(result: any): PotRoomAdminEntity {
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
