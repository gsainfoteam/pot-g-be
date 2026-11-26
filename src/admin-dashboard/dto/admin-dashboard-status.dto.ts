export class WebsocketStatusDto {
  totalConnections: number;
  authorizedConnections: number;
  uniqueUsers: number;
  canDeploySafely: boolean;
}

export class UserStatusDto {
  totalActiveUsers: number;
  recentActiveUsers: number;
}

export class ActivePotStatusDto {
  waitingDeparture: number;
  departedBeforeAccounting: number;
  stalePots: number;
}

export class ActivePotByRouteDto {
  routePk: string;
  routeName: string;
  activePotCount: number;
}

export class ReservedPopoMessageDto {
  type: string;
  count: number;
}

export class AppVersionStatusDto {
  iosMinVersion: string;
  iosLatestVersion: string;
  aosMinVersion: string;
  aosLatestVersion: string;
}

export class AdminDashboardStatusResponseDto {
  websocket: WebsocketStatusDto;
  users: UserStatusDto;
  activePots: ActivePotStatusDto;
  activePotsByRoute: ActivePotByRouteDto[];
  reservedPopoMessages: ReservedPopoMessageDto[];
  recentReportCount: number;
  appVersion: AppVersionStatusDto | null;
}
