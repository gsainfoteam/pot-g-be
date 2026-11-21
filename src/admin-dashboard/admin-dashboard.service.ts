import { BadRequestException, Injectable } from "@nestjs/common";
import {
  AdminDashboardRepository,
  DashboardDateRange,
} from "@src/admin-database/repository/admin-dashboard.repository";
import { WebsocketService } from "@src/websocket/websocket.service";
import { AdminDashboardStatusResponseDto } from "./dto/admin-dashboard-status.dto";
import {
  AdminDashboardStatsQueryDto,
  AdminDashboardStatsResponseDto,
} from "./dto/admin-dashboard-stats.dto";

@Injectable()
export class AdminDashboardService {
  constructor(
    private readonly dashboardRepository: AdminDashboardRepository,
    private readonly websocketService: WebsocketService,
  ) {}

  async getStatus(): Promise<AdminDashboardStatusResponseDto> {
    const wsStats = this.websocketService.getConnectedSessionStats();

    const [
      users,
      activePots,
      activePotsByRoute,
      reservedPopoMessages,
      recentReportCount,
      appVersion,
    ] = await Promise.all([
      this.dashboardRepository.getUserStatus(14),
      this.dashboardRepository.getActivePotStatus(7),
      this.dashboardRepository.getActivePotsByRoute(),
      this.dashboardRepository.getReservedPopoMessageCounts(),
      this.dashboardRepository.getRecentReportCount(7),
      this.dashboardRepository.getAppVersion(),
    ]);

    return {
      websocket: {
        ...wsStats,
        canDeploySafely: wsStats.totalConnections === 0,
      },
      users,
      activePots,
      activePotsByRoute,
      reservedPopoMessages,
      recentReportCount,
      appVersion,
    };
  }

  async getStats(
    query: AdminDashboardStatsQueryDto,
  ): Promise<AdminDashboardStatsResponseDto> {
    const range = this.parseDateRange(query);

    const [
      summaryRaw,
      passengerDistRaw,
      potsByHourRaw,
      potsByDayRaw,
      potsByRoute,
      monthlySignups,
      monthlyReports,
    ] = await Promise.all([
      this.dashboardRepository.getPotMatchingSummary(range),
      this.dashboardRepository.getPassengerDistribution(range),
      this.dashboardRepository.getPotCreationByHour(range),
      this.dashboardRepository.getPotCreationByDayOfWeek(range),
      this.dashboardRepository.getPotCreationByRoute(range),
      this.dashboardRepository.getMonthlySignups(range),
      this.dashboardRepository.getMonthlyReports(range),
    ]);

    const matchingRate =
      summaryRaw.totalCreatedPots === 0
        ? 0
        : Number(
            (
              (summaryRaw.confirmedPots / summaryRaw.totalCreatedPots) *
              100
            ).toFixed(2),
          );

    const distMap = new Map(
      passengerDistRaw.map((item) => [item.passengerCount, item.potCount]),
    );
    const maxPassenger = Math.max(
      4,
      ...passengerDistRaw.map((item) => item.passengerCount),
    );
    const passengerDistribution = Array.from(
      { length: maxPassenger - 1 },
      (_, idx) => {
        const passengerCount = idx + 2;
        return {
          passengerCount,
          potCount: distMap.get(passengerCount) ?? 0,
        };
      },
    );

    // 0~23시 빈 시간대 0으로 채우기
    const hourMap = new Map(
      potsByHourRaw.map((item) => [item.hour, item.count]),
    );
    const potsByHour = Array.from({ length: 24 }, (_, hour) => ({
      hour,
      count: hourMap.get(hour) ?? 0,
    }));

    // 0(일)~6(토) 빈 요일 0으로 채우기
    const dayMap = new Map(
      potsByDayRaw.map((item) => [item.dayOfWeek, item.count]),
    );
    const potsByDayOfWeek = Array.from({ length: 7 }, (_, dayOfWeek) => ({
      dayOfWeek,
      count: dayMap.get(dayOfWeek) ?? 0,
    }));

    return {
      summary: {
        ...summaryRaw,
        matchingRate,
      },
      passengerDistribution,
      potsByHour,
      potsByDayOfWeek,
      potsByRoute,
      monthlySignups,
      monthlyReports,
    };
  }

  private parseDateRange(
    query: AdminDashboardStatsQueryDto,
  ): DashboardDateRange {
    const range: DashboardDateRange = {};

    if (query.from) {
      const fromDate = new Date(query.from);
      if (Number.isNaN(fromDate.getTime())) {
        throw new BadRequestException("Invalid 'from' date format");
      }
      range.from = fromDate;
    }

    if (query.to) {
      const toDate = new Date(query.to);
      if (Number.isNaN(toDate.getTime())) {
        throw new BadRequestException("Invalid 'to' date format");
      }
      // 날짜만(YYYY-MM-DD) 들어온 경우 해당 날짜의 23:59:59.999까지 포함
      if (/^\d{4}-\d{2}-\d{2}$/.test(query.to)) {
        toDate.setHours(23, 59, 59, 999);
      }
      range.to = toDate;
    }

    return range;
  }
}
