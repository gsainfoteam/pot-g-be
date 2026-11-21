import { useCallback, useEffect, useState } from "react";
import { dashboardApi, type DashboardStatsResponse } from "../lib/api";

const DAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

function formatDateInput(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function StatsPage() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [data, setData] = useState<DashboardStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async (f: string, t: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await dashboardApi.getStats({
        from: f || undefined,
        to: t || undefined,
      });
      setData(res);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "통계를 불러오지 못했습니다.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchStats(from, to);
  }, [fetchStats, from, to]);

  const applyPreset = (months: number | null) => {
    if (months === null) {
      setFrom("");
      setTo("");
      return;
    }
    const end = new Date();
    const start = new Date();
    start.setMonth(start.getMonth() - months);
    setFrom(formatDateInput(start));
    setTo(formatDateInput(end));
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* 헤더 & 기간 필터 */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <h1 style={{ margin: 0, fontSize: 22 }}>통계</h1>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            flexWrap: "wrap",
          }}
        >
          <button
            type="button"
            onClick={() => applyPreset(null)}
            style={filterBtnStyle(!from && !to)}
          >
            전체
          </button>
          <button
            type="button"
            onClick={() => applyPreset(1)}
            style={filterBtnStyle(false)}
          >
            최근 1개월
          </button>
          <button
            type="button"
            onClick={() => applyPreset(3)}
            style={filterBtnStyle(false)}
          >
            최근 3개월
          </button>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            style={dateInputStyle}
          />
          <span>~</span>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            style={dateInputStyle}
          />
        </div>
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

      {loading && !data && <p style={{ color: "#6b7280" }}>불러오는 중...</p>}

      {data && (
        <>
          {/* 매칭 성사율 요약 배너 */}
          <div
            style={{
              background: "linear-gradient(135deg, #eff6ff 0%, #f5f3ff 100%)",
              border: "1px solid #bfdbfe",
              borderRadius: 12,
              padding: 20,
            }}
          >
            <p style={{ margin: 0, fontSize: 16, lineHeight: 1.6 }}>
              선택 기간 동안 총{" "}
              <strong>
                {data.summary.totalCreatedPots.toLocaleString()}개
              </strong>
              의 팟이 만들어졌고, 그중{" "}
              <strong style={{ color: "#1d4ed8" }}>
                {data.summary.confirmedPots.toLocaleString()}개
              </strong>
              의 팟(2인 이상)이 함께 택시를 타고 출발했어요!{" "}
              <span
                style={{
                  display: "inline-block",
                  padding: "2px 10px",
                  borderRadius: 999,
                  background: "#1d4ed8",
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: 14,
                  marginLeft: 6,
                }}
              >
                매칭률 {data.summary.matchingRate}%
              </span>
            </p>
            <p style={{ margin: "8px 0 0", fontSize: 14, color: "#4b5563" }}>
              출발 확정한 팟의 평균 동승 인원은{" "}
              <strong>{data.summary.avgPassengers}명</strong>입니다.
            </p>
          </div>

          <div style={cardStyle}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
                marginBottom: 12,
              }}
            >
              <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>
                출발 확정 팟 탑승 인원 분포
              </h2>
              <span style={{ fontSize: 13, color: "#4b5563" }}>
                평균 <strong>{data.summary.avgPassengers}명</strong> 탑승
              </span>
            </div>
            <VerticalBarChart
              items={data.passengerDistribution.map((item) => {
                const ratio =
                  data.summary.confirmedPots > 0
                    ? Math.round(
                        (item.potCount / data.summary.confirmedPots) * 100,
                      )
                    : 0;
                return {
                  label: `${item.passengerCount}명 (${ratio}%)`,
                  value: item.potCount,
                  tooltip: `${item.passengerCount}명 탑승: ${item.potCount}개 (${ratio}%)`,
                };
              })}
              color="#8b5cf6"
            />
          </div>

          {/* 시간대별 / 요일별 팟 생성 그래프 */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
              gap: 16,
            }}
          >
            <div style={cardStyle}>
              <h2 style={sectionTitleStyle}>시간대별 팟 생성 (KST)</h2>
              <VerticalBarChart
                items={data.potsByHour.map((item) => ({
                  label: `${item.hour}`,
                  value: item.count,
                  tooltip: `${item.hour}시: ${item.count}개`,
                }))}
                color="#3b82f6"
              />
            </div>

            <div style={cardStyle}>
              <h2 style={sectionTitleStyle}>요일별 팟 생성 (KST)</h2>
              <VerticalBarChart
                items={data.potsByDayOfWeek.map((item) => ({
                  label: DAY_LABELS[item.dayOfWeek] ?? String(item.dayOfWeek),
                  value: item.count,
                  tooltip: `${DAY_LABELS[item.dayOfWeek]}요일: ${item.count}개`,
                }))}
                color="#6366f1"
              />
            </div>
          </div>

          {/* 노선별 팟 생성 그래프 */}
          <div style={cardStyle}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 8,
                marginBottom: 14,
              }}
            >
              <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>
                노선별 팟 생성
              </h2>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  fontSize: 12,
                  color: "#4b5563",
                }}
              >
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <span
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: 3,
                      background: "#93c5fd",
                      display: "inline-block",
                    }}
                  />
                  전체 생성
                </span>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <span
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: 3,
                      background: "#2563eb",
                      display: "inline-block",
                    }}
                  />
                  2인+ 확정
                </span>
              </div>
            </div>
            {data.potsByRoute.length === 0 ? (
              <p style={{ color: "#6b7280", fontSize: 13 }}>
                데이터가 없습니다.
              </p>
            ) : (
              <div
                style={{ display: "flex", flexDirection: "column", gap: 10 }}
              >
                {(() => {
                  const maxVal = Math.max(
                    ...data.potsByRoute.map((r) => r.totalCount),
                    1,
                  );
                  return data.potsByRoute.map((r) => (
                    <div
                      key={r.routePk}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "140px 1fr 90px",
                        alignItems: "center",
                        gap: 12,
                        fontSize: 13,
                      }}
                    >
                      <span
                        style={{
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          fontWeight: 600,
                        }}
                        title={r.routeName}
                      >
                        {r.routeName}
                      </span>
                      <div
                        style={{
                          position: "relative",
                          height: 18,
                          background: "#f3f4f6",
                          borderRadius: 6,
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            position: "absolute",
                            inset: 0,
                            width: `${(r.totalCount / maxVal) * 100}%`,
                            background: "#93c5fd",
                          }}
                        />
                        <div
                          style={{
                            position: "absolute",
                            inset: 0,
                            width: `${(r.confirmedCount / maxVal) * 100}%`,
                            background: "#2563eb",
                          }}
                        />
                      </div>
                      <span
                        style={{ textAlign: "right", color: "#374151" }}
                        title={`전체 ${r.totalCount}개 중 2인+ 확정 ${r.confirmedCount}개`}
                      >
                        <span style={{ color: "#6b7280" }}>{r.totalCount}</span>{" "}
                        /{" "}
                        <strong style={{ color: "#2563eb" }}>
                          {r.confirmedCount}
                        </strong>
                      </span>
                    </div>
                  ));
                })()}
              </div>
            )}
          </div>

          {/* 월별 가입자 수 / 월별 신고 수 */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
              gap: 16,
            }}
          >
            <div style={cardStyle}>
              <h2 style={sectionTitleStyle}>월별 신규 가입자 수</h2>
              <VerticalBarChart
                items={data.monthlySignups.map((item) => ({
                  label: item.month.slice(2),
                  value: item.count,
                  tooltip: `${item.month}: ${item.count}명`,
                }))}
                color="#10b981"
              />
            </div>

            <div style={cardStyle}>
              <h2 style={sectionTitleStyle}>월별 신고 수</h2>
              <VerticalBarChart
                items={data.monthlyReports.map((item) => ({
                  label: item.month.slice(2),
                  value: item.count,
                  tooltip: `${item.month}: ${item.count}건`,
                }))}
                color="#ef4444"
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function VerticalBarChart({
  items,
  color,
}: {
  items: Array<{ label: string; value: number; tooltip: string }>;
  color: string;
}) {
  if (items.length === 0) {
    return <p style={{ color: "#6b7280", fontSize: 13 }}>데이터가 없습니다.</p>;
  }

  const maxVal = Math.max(...items.map((i) => i.value), 1);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-end",
        gap: 4,
        height: 170,
        paddingTop: 16,
      }}
    >
      {items.map((item) => (
        <div
          key={item.label}
          title={item.tooltip}
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            height: "100%",
            justifyContent: "flex-end",
            minWidth: 0,
          }}
        >
          <span style={{ fontSize: 10, color: "#6b7280", marginBottom: 2 }}>
            {item.value > 0 ? item.value : ""}
          </span>
          <div
            style={{
              width: "100%",
              maxWidth: 28,
              height: `${Math.max((item.value / maxVal) * 120, item.value > 0 ? 4 : 1)}px`,
              background: item.value > 0 ? color : "#e5e7eb",
              borderRadius: "4px 4px 0 0",
            }}
          />
          <span
            style={{
              fontSize: 10,
              color: "#6b7280",
              marginTop: 4,
              whiteSpace: "nowrap",
            }}
          >
            {item.label}
          </span>
        </div>
      ))}
    </div>
  );
}

const cardStyle: React.CSSProperties = {
  background: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  padding: 18,
};

const sectionTitleStyle: React.CSSProperties = {
  margin: "0 0 12px",
  fontSize: 15,
  fontWeight: 700,
};

const dateInputStyle: React.CSSProperties = {
  padding: "6px 10px",
  borderRadius: 8,
  border: "1px solid #d1d5db",
  fontSize: 13,
};

function filterBtnStyle(active: boolean): React.CSSProperties {
  return {
    padding: "6px 12px",
    borderRadius: 8,
    border: "1px solid #d1d5db",
    background: active ? "#111827" : "#ffffff",
    color: active ? "#ffffff" : "#111827",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
  };
}
