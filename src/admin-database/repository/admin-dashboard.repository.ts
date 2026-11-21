import { Injectable } from "@nestjs/common";
import { sql } from "drizzle-orm";
import { DatabaseService } from "@src/database/database.service";
import { getPotDepartureTime } from "../query/pot-departure-time";

export interface DashboardDateRange {
  from?: Date;
  to?: Date;
}

@Injectable()
export class AdminDashboardRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  // =========================================================================
  // 1. [현황] (Real-time Status) 쿼리
  // =========================================================================

  /**
   * 유저 현황: 전체 활성(미탈퇴) 유저 수 & 최근 N일 이내 팟 생성/참여 유저 수
   */
  async getUserStatus(recentDays = 14): Promise<{
    totalActiveUsers: number;
    recentActiveUsers: number;
  }> {
    const [totalRes, recentRes] = await Promise.all([
      this.databaseService.db.execute<{ count: number }>(sql`
        SELECT COUNT(*)::int AS count
        FROM users
        WHERE is_deleted = false
      `),
      this.databaseService.db.execute<{ count: number }>(sql`
        SELECT COUNT(DISTINCT upr.user_fk)::int AS count
        FROM user_pot_room AS upr
        INNER JOIN pot_room AS pr ON pr.pk = upr.pot_room_fk
        WHERE pr.created_at >= NOW() - (${recentDays} * INTERVAL '1 day')
      `),
    ]);

    return {
      totalActiveUsers: Number(totalRes.rows[0]?.count ?? 0),
      recentActiveUsers: Number(recentRes.rows[0]?.count ?? 0),
    };
  }

  /**
   * 현재 활성화된 팟(is_archived = false, is_deleted = false) 상태별 개수
   * - waitingDeparture: 출발 대기 (출발 시각 기준 staleDays 미경과)
   * - departedBeforeAccounting: 출발 확정 ~ 정산 요청 이전 (출발 시각 기준 staleDays 미경과)
   * - stalePots: 출발 시각(starts_at) 기준 staleDays(기본 7일) 이상 지난 장기 방치 팟
   */
  /**
   * 현재 활성화된 팟(is_archived = false, is_deleted = false) 상태별 개수
   * - 기준 시각(effective_departure_time): 출발 확정 이벤트(departure_confirm_v1)의 departureTime, 없으면 starts_at
   * - waitingDeparture: 출발 대기 (출발 시각 기준 staleDays 미경과)
   * - departedBeforeAccounting: 출발 확정 ~ 정산 요청 이전 (출발 시각 기준 staleDays 미경과)
   * - stalePots: 출발 시각 기준 staleDays(기본 7일) 이상 지난 장기 방치 팟
   */
  async getActivePotStatus(staleDays = 7): Promise<{
    waitingDeparture: number;
    departedBeforeAccounting: number;
    stalePots: number;
  }> {
    const res = await this.databaseService.db.execute<{
      waiting_departure: number;
      departed_before_accounting: number;
      stale_pots: number;
    }>(sql`
      WITH active_pots AS (
        SELECT
          pot_room.pk,
          pot_room.is_departure_confirmed,
          COALESCE(${getPotDepartureTime()}, pot_room.starts_at) AS effective_departure_time
        FROM pot_room
        WHERE pot_room.is_archived = false
          AND pot_room.is_deleted = false
      )
      SELECT
        COUNT(*) FILTER (
          WHERE ap.is_departure_confirmed = false
            AND ap.effective_departure_time > NOW() - (${staleDays} * INTERVAL '1 day')
        )::int AS waiting_departure,
        COUNT(*) FILTER (
          WHERE ap.is_departure_confirmed = true
            AND ap.effective_departure_time > NOW() - (${staleDays} * INTERVAL '1 day')
            AND NOT EXISTS (
              SELECT 1
              FROM pot_event AS pe
              WHERE pe.pot_fk = ap.pk
                AND pe.type = 'accounting_request_v1'
            )
        )::int AS departed_before_accounting,
        COUNT(*) FILTER (
          WHERE ap.effective_departure_time <= NOW() - (${staleDays} * INTERVAL '1 day')
        )::int AS stale_pots
      FROM active_pots AS ap
    `);

    const row = res.rows[0];

    return {
      waitingDeparture: Number(row?.waiting_departure ?? 0),
      departedBeforeAccounting: Number(row?.departed_before_accounting ?? 0),
      stalePots: Number(row?.stale_pots ?? 0),
    };
  }

  /**
   * 실시간 노선별 활성 팟 현황 (출발 이전 ~ 출발 완료 미해산 팟)
   */
  async getActivePotsByRoute(): Promise<
    Array<{
      routePk: string;
      routeName: string;
      activePotCount: number;
    }>
  > {
    const res = await this.databaseService.db.execute<{
      route_pk: string;
      route_name: string;
      active_pot_count: number;
    }>(sql`
      SELECT
        r.pk AS route_pk,
        r.short_name_kor AS route_name,
        COUNT(pr.pk)::int AS active_pot_count
      FROM pot_room AS pr
      INNER JOIN route AS r ON r.pk = pr.route_fk
      WHERE pr.is_archived = false
        AND pr.is_deleted = false
      GROUP BY r.pk, r.short_name_kor
      ORDER BY active_pot_count DESC, r.short_name_kor ASC
    `);

    return res.rows.map((row) => ({
      routePk: row.route_pk,
      routeName: row.route_name,
      activePotCount: Number(row.active_pot_count),
    }));
  }

  /**
   * 실시간 예약된 포포 메시지 수 (타입별)
   */
  async getReservedPopoMessageCounts(): Promise<
    Array<{
      type: string;
      count: number;
    }>
  > {
    const res = await this.databaseService.db.execute<{
      type: string;
      count: number;
    }>(sql`
      SELECT
        popo_chat_msg_type::text AS type,
        COUNT(*)::int AS count
      FROM popo_chat_reservation
      GROUP BY popo_chat_msg_type
      ORDER BY count DESC
    `);

    return res.rows.map((row) => ({
      type: row.type,
      count: Number(row.count),
    }));
  }

  /**
   * 최근 N일 이내 접수된 신고 수
   */
  async getRecentReportCount(recentDays = 7): Promise<number> {
    const res = await this.databaseService.db.execute<{ count: number }>(sql`
      SELECT COUNT(*)::int AS count
      FROM report
      WHERE created_at >= NOW() - (${recentDays} * INTERVAL '1 day')
    `);

    return Number(res.rows[0]?.count ?? 0);
  }

  /**
   * 현재 앱 버전 4종 조회
   */
  async getAppVersion(): Promise<{
    iosMinVersion: string;
    iosLatestVersion: string;
    aosMinVersion: string;
    aosLatestVersion: string;
  } | null> {
    const res = await this.databaseService.db.execute<{
      ios_min_version: string;
      ios_latest_version: string;
      aos_min_version: string;
      aos_latest_version: string;
    }>(sql`
      SELECT
        ios_min_version,
        ios_latest_version,
        aos_min_version,
        aos_latest_version
      FROM app_version
      LIMIT 1
    `);

    const row = res.rows[0];
    if (!row) {
      return null;
    }

    return {
      iosMinVersion: row.ios_min_version,
      iosLatestVersion: row.ios_latest_version,
      aosMinVersion: row.aos_min_version,
      aosLatestVersion: row.aos_latest_version,
    };
  }

  // =========================================================================
  // 2. [통계] (Analytics) 쿼리 — 기간 필터(from, to) 지원
  // =========================================================================

  /**
   * 전체 생성된 팟 수, 2인 이상 출발 확정 팟 수, 평균 동승 인원
   */
  async getPotMatchingSummary(range: DashboardDateRange = {}): Promise<{
    totalCreatedPots: number;
    confirmedPots: number;
    avgPassengers: number;
  }> {
    const dateFilter = this.buildDateRangeCondition(sql`pr.created_at`, range);

    const [totalRes, confirmedRes] = await Promise.all([
      this.databaseService.db.execute<{ count: number }>(sql`
        SELECT COUNT(*)::int AS count
        FROM pot_room AS pr
        WHERE 1 = 1 ${dateFilter}
      `),
      this.databaseService.db.execute<{
        confirmed_count: number;
        avg_passengers: number;
      }>(sql`
        SELECT
          COUNT(*)::int AS confirmed_count,
          COALESCE(AVG(s.member_count), 0)::float AS avg_passengers
        FROM (
          SELECT
            pr.pk,
            COUNT(DISTINCT upr.user_fk)::int AS member_count
          FROM pot_room AS pr
          LEFT OUTER JOIN user_pot_room AS upr ON pr.pk = upr.pot_room_fk
          WHERE pr.is_departure_confirmed = true
            ${dateFilter}
          GROUP BY pr.pk
        ) AS s
        WHERE s.member_count > 1
      `),
    ]);

    return {
      totalCreatedPots: Number(totalRes.rows[0]?.count ?? 0),
      confirmedPots: Number(confirmedRes.rows[0]?.confirmed_count ?? 0),
      avgPassengers: Number(
        Number(confirmedRes.rows[0]?.avg_passengers ?? 0).toFixed(2),
      ),
    };
  }

  /**
   * 시간대별(0~23시, KST 기준) 팟 생성 수
   */
  async getPotCreationByHour(range: DashboardDateRange = {}): Promise<
    Array<{
      hour: number;
      count: number;
    }>
  > {
    const dateFilter = this.buildDateRangeCondition(sql`created_at`, range);

    const res = await this.databaseService.db.execute<{
      hour: number;
      count: number;
    }>(sql`
      SELECT
        EXTRACT(HOUR FROM created_at AT TIME ZONE 'Asia/Seoul')::int AS hour,
        COUNT(*)::int AS count
      FROM pot_room
      WHERE 1 = 1 ${dateFilter}
      GROUP BY hour
      ORDER BY hour ASC
    `);

    return res.rows.map((row) => ({
      hour: Number(row.hour),
      count: Number(row.count),
    }));
  }

  /**
   * 요일별(0: 일요일 ~ 6: 토요일, KST 기준) 팟 생성 수
   */
  async getPotCreationByDayOfWeek(range: DashboardDateRange = {}): Promise<
    Array<{
      dayOfWeek: number;
      count: number;
    }>
  > {
    const dateFilter = this.buildDateRangeCondition(sql`created_at`, range);

    const res = await this.databaseService.db.execute<{
      day_of_week: number;
      count: number;
    }>(sql`
      SELECT
        EXTRACT(DOW FROM created_at AT TIME ZONE 'Asia/Seoul')::int AS day_of_week,
        COUNT(*)::int AS count
      FROM pot_room
      WHERE 1 = 1 ${dateFilter}
      GROUP BY day_of_week
      ORDER BY day_of_week ASC
    `);

    return res.rows.map((row) => ({
      dayOfWeek: Number(row.day_of_week),
      count: Number(row.count),
    }));
  }

  /**
   * 노선별 팟 생성 수 (전체 생성 수 & 2인 이상 확정 팟 수)
   */
  async getPotCreationByRoute(range: DashboardDateRange = {}): Promise<
    Array<{
      routePk: string;
      routeName: string;
      totalCount: number;
      confirmedCount: number;
    }>
  > {
    const dateFilter = this.buildDateRangeCondition(sql`pr.created_at`, range);

    const res = await this.databaseService.db.execute<{
      route_pk: string;
      route_name: string;
      total_count: number;
      confirmed_count: number;
    }>(sql`
      SELECT
        r.pk AS route_pk,
        r.short_name_kor AS route_name,
        COUNT(pot_stats.pk)::int AS total_count,
        COUNT(pot_stats.pk) FILTER (
          WHERE pot_stats.is_departure_confirmed = true
            AND pot_stats.member_count > 1
        )::int AS confirmed_count
      FROM (
        SELECT
          pr.pk,
          pr.route_fk,
          pr.is_departure_confirmed,
          COUNT(DISTINCT upr.user_fk)::int AS member_count
        FROM pot_room AS pr
        LEFT OUTER JOIN user_pot_room AS upr ON pr.pk = upr.pot_room_fk
        WHERE 1 = 1 ${dateFilter}
        GROUP BY pr.pk, pr.route_fk, pr.is_departure_confirmed
      ) AS pot_stats
      INNER JOIN route AS r ON r.pk = pot_stats.route_fk
      GROUP BY r.pk, r.short_name_kor
      ORDER BY total_count DESC, r.short_name_kor ASC
    `);

    return res.rows.map((row) => ({
      routePk: row.route_pk,
      routeName: row.route_name,
      totalCount: Number(row.total_count),
      confirmedCount: Number(row.confirmed_count),
    }));
  }

  /**
   * 월별 신규 가입자 수 (YYYY-MM, KST 기준)
   */
  async getMonthlySignups(range: DashboardDateRange = {}): Promise<
    Array<{
      month: string;
      count: number;
    }>
  > {
    const dateFilter = this.buildDateRangeCondition(sql`created_at`, range);

    const res = await this.databaseService.db.execute<{
      month: string;
      count: number;
    }>(sql`
      SELECT
        TO_CHAR(DATE_TRUNC('month', created_at AT TIME ZONE 'Asia/Seoul'), 'YYYY-MM') AS month,
        COUNT(*)::int AS count
      FROM users
      WHERE is_deleted = false
        ${dateFilter}
      GROUP BY month
      ORDER BY month ASC
    `);

    return res.rows.map((row) => ({
      month: row.month,
      count: Number(row.count),
    }));
  }

  /**
   * 월별 신고 수 (YYYY-MM, KST 기준)
   */
  async getMonthlyReports(range: DashboardDateRange = {}): Promise<
    Array<{
      month: string;
      count: number;
    }>
  > {
    const dateFilter = this.buildDateRangeCondition(sql`created_at`, range);

    const res = await this.databaseService.db.execute<{
      month: string;
      count: number;
    }>(sql`
      SELECT
        TO_CHAR(DATE_TRUNC('month', created_at AT TIME ZONE 'Asia/Seoul'), 'YYYY-MM') AS month,
        COUNT(*)::int AS count
      FROM report
      WHERE 1 = 1 ${dateFilter}
      GROUP BY month
      ORDER BY month ASC
    `);

    return res.rows.map((row) => ({
      month: row.month,
      count: Number(row.count),
    }));
  }

  /**
   * 2인 이상 출발 확정 팟의 탑승 인원별(2명, 3명, 4명 등) 분포
   */
  async getPassengerDistribution(range: DashboardDateRange = {}): Promise<
    Array<{
      passengerCount: number;
      potCount: number;
    }>
  > {
    const dateFilter = this.buildDateRangeCondition(sql`pr.created_at`, range);

    const res = await this.databaseService.db.execute<{
      passenger_count: number;
      pot_count: number;
    }>(sql`
      SELECT
        s.member_count AS passenger_count,
        COUNT(*)::int AS pot_count
      FROM (
        SELECT
          pr.pk,
          COUNT(DISTINCT upr.user_fk)::int AS member_count
        FROM pot_room AS pr
        LEFT OUTER JOIN user_pot_room AS upr ON pr.pk = upr.pot_room_fk
        WHERE pr.is_departure_confirmed = true
          ${dateFilter}
        GROUP BY pr.pk
      ) AS s
      WHERE s.member_count > 1
      GROUP BY s.member_count
      ORDER BY s.member_count ASC
    `);

    return res.rows.map((row) => ({
      passengerCount: Number(row.passenger_count),
      potCount: Number(row.pot_count),
    }));
  }

  // =========================================================================
  // Helper
  // =========================================================================

  private buildDateRangeCondition(
    column: ReturnType<typeof sql>,
    range: DashboardDateRange,
  ) {
    const conditions = [];
    if (range.from) {
      conditions.push(sql`AND ${column} >= ${range.from}`);
    }
    if (range.to) {
      conditions.push(sql`AND ${column} <= ${range.to}`);
    }
    return conditions.length > 0 ? sql.join(conditions, sql` `) : sql``;
  }
}
