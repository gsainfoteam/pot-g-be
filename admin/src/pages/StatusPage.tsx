import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { dashboardApi, type DashboardStatusResponse } from "../lib/api";

export function StatusPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchStatus = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await dashboardApi.getStatus();
      setData(res);
      setLastUpdated(new Date());
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "현황을 불러오지 못했습니다.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchStatus();
  }, [fetchStatus]);

  useEffect(() => {
    let active = true;
    const timer = window.setInterval(async () => {
      try {
        const ws = await dashboardApi.getWebsocketStatus();
        if (!active) return;
        setData((prev) => (prev ? { ...prev, websocket: ws } : prev));
      } catch {
        // 5초 주기 백그라운드 갱신 실패 시 기존 화면 유지
      }
    }, 5000);

    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* 헤더 */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: 22 }}>현황</h1>
          {lastUpdated && (
            <p style={{ margin: "4px 0 0", fontSize: 13, color: "#6b7280" }}>
              마지막 갱신: {lastUpdated.toLocaleTimeString("ko-KR")}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={() => void fetchStatus()}
          disabled={loading}
          style={{
            padding: "8px 14px",
            borderRadius: 8,
            border: "1px solid #d1d5db",
            background: "#fff",
            cursor: loading ? "not-allowed" : "pointer",
            fontWeight: 600,
          }}
        >
          {loading ? "불러오는 중..." : "새로고침"}
        </button>
      </div>

      {error && (
        <div
          style={{
            padding: 14,
            borderRadius: 8,
            background: "#fef2f2",
            color: "#b91c1c",
            border: "1px solid #fecaca",
          }}
        >
          {error}
        </div>
      )}

      {data && (
        <>
          {/* 상단 요약 카드 4종 */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: 16,
            }}
          >
            {/* 1. 실시간 웹소켓 접속자 */}
            <div style={cardStyle}>
              <div style={cardHeaderStyle}>
                <span style={cardLabelStyle}>실시간 웹소켓 접속</span>
                <span
                  style={{
                    padding: "3px 8px",
                    borderRadius: 999,
                    fontSize: 12,
                    fontWeight: 700,
                    background: data.websocket.canDeploySafely
                      ? "#dcfce7"
                      : "#fef3c7",
                    color: data.websocket.canDeploySafely
                      ? "#166534"
                      : "#92400e",
                  }}
                >
                  {data.websocket.canDeploySafely ? "배포 가능" : "배포 주의"}
                </span>
              </div>
              <div style={bigNumberStyle}>
                {data.websocket.totalConnections}
                <span style={unitStyle}>세션</span>
              </div>
              <div style={subTextStyle}>
                인증 세션 {data.websocket.authorizedConnections} · 고유 유저{" "}
                {data.websocket.uniqueUsers}명
              </div>
            </div>

            {/* 2. 유저 현황 */}
            <div style={cardStyle}>
              <div style={cardHeaderStyle}>
                <span style={cardLabelStyle}>유저 현황</span>
              </div>
              <div style={bigNumberStyle}>
                {data.users.totalActiveUsers.toLocaleString()}
                <span style={unitStyle}>명</span>
              </div>
              <div style={subTextStyle}>
                최근 2주 활성 유저:{" "}
                <strong>
                  {data.users.recentActiveUsers.toLocaleString()}명
                </strong>
              </div>
              <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 4 }}>
                * 전체: 미탈퇴 가입자 / 활성: 최근 14일 내 팟 생성·참여 유저
              </div>
            </div>

            {/* 3. 활성화된 팟 */}
            <div style={cardStyle}>
              <div style={cardHeaderStyle}>
                <span style={cardLabelStyle}>활성화된 팟</span>
                {data.activePots.stalePots > 0 && (
                  <button
                    type="button"
                    onClick={() => navigate("/pot-cleanup")}
                    style={{
                      padding: "2px 8px",
                      borderRadius: 999,
                      border: "none",
                      fontSize: 12,
                      fontWeight: 700,
                      background: "#fee2e2",
                      color: "#991b1b",
                      cursor: "pointer",
                    }}
                  >
                    방치 {data.activePots.stalePots}건 확인
                  </button>
                )}
              </div>
              <div style={{ display: "flex", gap: 16, marginTop: 8 }}>
                <div>
                  <div style={{ fontSize: 12, color: "#6b7280" }}>
                    출발 대기
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 700 }}>
                    {data.activePots.waitingDeparture}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: "#6b7280" }}>
                    출발~정산 전
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 700 }}>
                    {data.activePots.departedBeforeAccounting}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: "#6b7280" }}>
                    7일+ 방치
                  </div>
                  <div
                    style={{
                      fontSize: 22,
                      fontWeight: 700,
                      color:
                        data.activePots.stalePots > 0 ? "#dc2626" : "#111827",
                    }}
                  >
                    {data.activePots.stalePots}
                  </div>
                </div>
              </div>
            </div>

            {/* 4. 최근 신고 수 */}
            <div style={cardStyle}>
              <div style={cardHeaderStyle}>
                <span style={cardLabelStyle}>최근 1개월 신고</span>
              </div>
              <div
                style={{
                  ...bigNumberStyle,
                  color: data.recentReportCount > 0 ? "#dc2626" : "#111827",
                }}
              >
                {data.recentReportCount}
                <span style={unitStyle}>건</span>
              </div>
              <div style={subTextStyle}>최근 1개월 이내 접수된 신고</div>
            </div>
          </div>

          {/* 앱 버전 4종 (클릭 시 /versions 이동) */}
          <div
            role="button"
            tabIndex={0}
            onClick={() => navigate("/versions")}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") navigate("/versions");
            }}
            style={{
              ...cardStyle,
              cursor: "pointer",
              transition: "border-color 0.15s",
            }}
          >
            <div style={cardHeaderStyle}>
              <span style={{ fontWeight: 700, fontSize: 15 }}>
                앱 버전 현황
              </span>
              <span style={{ fontSize: 13, color: "#2563eb", fontWeight: 600 }}>
                버전 수정 페이지로 이동 →
              </span>
            </div>
            {data.appVersion ? (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
                  gap: 12,
                  marginTop: 12,
                }}
              >
                <VersionItem
                  label="iOS 최소 버전"
                  value={data.appVersion.iosMinVersion}
                />
                <VersionItem
                  label="iOS 최신 버전"
                  value={data.appVersion.iosLatestVersion}
                />
                <VersionItem
                  label="Android 최소 버전"
                  value={data.appVersion.aosMinVersion}
                />
                <VersionItem
                  label="Android 최신 버전"
                  value={data.appVersion.aosLatestVersion}
                />
              </div>
            ) : (
              <p style={subTextStyle}>등록된 앱 버전 정보가 없습니다.</p>
            )}
          </div>

          {/* 하단 2단: 실시간 노선별 현황 & 예약된 포포 메시지 */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: 16,
            }}
          >
            <div style={cardStyle}>
              <h2 style={sectionTitleStyle}>실시간 노선별 활성 팟</h2>
              {data.activePotsByRoute.length === 0 ? (
                <p style={subTextStyle}>현재 활성화된 팟이 없습니다.</p>
              ) : (
                <ul style={listStyle}>
                  {data.activePotsByRoute.map((item) => (
                    <li key={item.routePk} style={listItemStyle}>
                      <span>{item.routeName}</span>
                      <strong>{item.activePotCount}개</strong>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div style={cardStyle}>
              <h2 style={sectionTitleStyle}>예약된 포포 메시지 (타입별)</h2>
              {data.reservedPopoMessages.length === 0 ? (
                <p style={subTextStyle}>현재 예약된 포포 메시지가 없습니다.</p>
              ) : (
                <ul style={listStyle}>
                  {data.reservedPopoMessages.map((item) => (
                    <li key={item.type} style={listItemStyle}>
                      <code style={{ fontSize: 13 }}>{item.type}</code>
                      <strong>{item.count}건</strong>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function VersionItem({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        padding: "10px 12px",
        borderRadius: 8,
        background: "#f9fafb",
        border: "1px solid #e5e7eb",
      }}
    >
      <div style={{ fontSize: 12, color: "#6b7280" }}>{label}</div>
      <div style={{ fontSize: 16, fontWeight: 700, marginTop: 4 }}>{value}</div>
    </div>
  );
}

const cardStyle: React.CSSProperties = {
  background: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  padding: 18,
};

const cardHeaderStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 8,
};

const cardLabelStyle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 600,
  color: "#6b7280",
};

const bigNumberStyle: React.CSSProperties = {
  fontSize: 28,
  fontWeight: 800,
  marginTop: 8,
  color: "#111827",
};

const unitStyle: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 500,
  marginLeft: 4,
  color: "#6b7280",
};

const subTextStyle: React.CSSProperties = {
  fontSize: 13,
  color: "#6b7280",
  marginTop: 6,
};

const sectionTitleStyle: React.CSSProperties = {
  margin: "0 0 12px",
  fontSize: 15,
  fontWeight: 700,
};

const listStyle: React.CSSProperties = {
  listStyle: "none",
  margin: 0,
  padding: 0,
  display: "flex",
  flexDirection: "column",
  gap: 8,
};

const listItemStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "8px 10px",
  borderRadius: 8,
  background: "#f9fafb",
  fontSize: 14,
};
