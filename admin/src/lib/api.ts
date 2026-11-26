import { clearAccessToken, getAccessToken } from "./auth";

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getAccessToken();

  const res = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  });

  if (res.status === 401) {
    clearAccessToken();
    window.location.href = "/login";
    throw new ApiError(401, "Unauthorized");
  }

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new ApiError(res.status, body || res.statusText);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return res.json() as Promise<T>;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "POST", body: JSON.stringify(body) }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "PATCH", body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};

export interface DashboardStatusResponse {
  websocket: {
    totalConnections: number;
    authorizedConnections: number;
    uniqueUsers: number;
    canDeploySafely: boolean;
  };
  users: {
    totalActiveUsers: number;
    recentActiveUsers: number;
  };
  activePots: {
    waitingDeparture: number;
    departedBeforeAccounting: number;
    stalePots: number;
  };
  activePotsByRoute: Array<{
    routePk: string;
    routeName: string;
    activePotCount: number;
  }>;
  reservedPopoMessages: Array<{
    type: string;
    count: number;
  }>;
  recentReportCount: number;
  appVersion: {
    iosMinVersion: string;
    iosLatestVersion: string;
    aosMinVersion: string;
    aosLatestVersion: string;
  } | null;
}

export interface DashboardStatsResponse {
  summary: {
    totalCreatedPots: number;
    confirmedPots: number;
    matchingRate: number;
    avgPassengers: number;
  };
  passengerDistribution: Array<{ passengerCount: number; potCount: number }>; // 👈 이 한 줄 추가
  potsByHour: Array<{ hour: number; count: number }>;
  potsByDayOfWeek: Array<{ dayOfWeek: number; count: number }>;
  potsByRoute: Array<{
    routePk: string;
    routeName: string;
    totalCount: number;
    confirmedCount: number;
  }>;
  monthlySignups: Array<{
    month: string;
    newCount: number;
    cumulativeCount: number;
    activeCount: number;
  }>;
  monthlyReports: Array<{ month: string; count: number }>;
}

export const dashboardApi = {
  getStatus: () =>
    api.get<DashboardStatusResponse>("/api/manager/v1/dashboard/status"),
  getWebsocketStatus: () =>
    api.get<DashboardStatusResponse["websocket"]>(
      "/api/manager/v1/dashboard/websocket-status",
    ),
  getStats: (params?: { from?: string; to?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.from) searchParams.set("from", params.from);
    if (params?.to) searchParams.set("to", params.to);
    const qs = searchParams.toString();
    return api.get<DashboardStatsResponse>(
      `/api/manager/v1/dashboard/stats${qs ? `?${qs}` : ""}`,
    );
  },
};
