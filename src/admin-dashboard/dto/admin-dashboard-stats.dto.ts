export class AdminDashboardStatsQueryDto {
  from?: string; // ISO 날짜 문자열 (예: 2026-08-01)
  to?: string; // ISO 날짜 문자열 (예: 2026-11-21)
}

export class PotMatchingSummaryDto {
  totalCreatedPots: number;
  confirmedPots: number;
  matchingRate: number; // 백분율 (예: 17.37)
  avgPassengers: number;
}

export class PotCreationByHourDto {
  hour: number; // 0 ~ 23
  count: number;
}

export class PotCreationByDayOfWeekDto {
  dayOfWeek: number; // 0(일) ~ 6(토)
  count: number;
}

export class PotCreationByRouteDto {
  routePk: string;
  routeName: string;
  totalCount: number;
  confirmedCount: number;
}

export class MonthlyCountDto {
  month: string; // YYYY-MM
  count: number;
}

export class AdminDashboardStatsResponseDto {
  summary: PotMatchingSummaryDto;
  potsByHour: PotCreationByHourDto[];
  potsByDayOfWeek: PotCreationByDayOfWeekDto[];
  potsByRoute: PotCreationByRouteDto[];
  monthlySignups: MonthlyCountDto[];
  monthlyReports: MonthlyCountDto[];
  passengerDistribution: PassengerDistributionDto[];
}

export class PassengerDistributionDto {
  passengerCount: number; // 2, 3, 4 ...
  potCount: number;
}
