import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, ApiError } from "../lib/api";
import { formatDateTime } from "../lib/format";
import { POT_STATUS_LABEL } from "../lib/pot";

export type PotDto = {
  pk: string;
  name: string;
  route_name: string;
  status: string;
  current: number;
  total: number;
  starts_at: string;
  ends_at: string;
  departure_time: string | null;
  created_at: string;
};

function PotTable({ pots, empty }: { pots: PotDto[]; empty: string }) {
  const navigate = useNavigate();

  return (
    <table>
      <thead>
        <tr>
          <th>이름</th>
          <th>노선</th>
          <th>상태</th>
          <th>인원</th>
          <th>출발 가능 시간</th>
          <th>확정 출발 시간</th>
          <th>생성일</th>
        </tr>
      </thead>
      <tbody>
        {pots.map((pot) => (
          <tr
            key={pot.pk}
            className="clickable-row"
            onClick={() => navigate(`/pots/${pot.pk}`)}
          >
            <td>{pot.name}</td>
            <td>{pot.route_name}</td>
            <td>{POT_STATUS_LABEL[pot.status] ?? pot.status}</td>
            <td>
              {pot.current}/{pot.total}
            </td>
            <td>
              {formatDateTime(pot.starts_at)} ~ {formatDateTime(pot.ends_at)}
            </td>
            <td>
              {pot.departure_time ? formatDateTime(pot.departure_time) : "-"}
            </td>
            <td>{formatDateTime(pot.created_at)}</td>
          </tr>
        ))}
        {pots.length === 0 && (
          <tr>
            <td colSpan={7} className="placeholder">
              {empty}
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}

function loadError(err: unknown): string {
  return err instanceof ApiError
    ? `팟 목록을 불러오지 못했습니다. (${err.status})`
    : "팟 목록을 불러오지 못했습니다.";
}

export function PotsPage() {
  const [overdue, setOverdue] = useState<PotDto[] | null>(null);
  const [all, setAll] = useState<PotDto[] | null>(null);
  const [allOpen, setAllOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<PotDto[]>("/api/manager/v1/pot/overdue")
      .then(setOverdue)
      .catch((err) => setError(loadError(err)));
  }, []);

  const toggleAll = () => {
    const next = !allOpen;
    setAllOpen(next);
    // 처음 펼칠 때만 전체 목록을 불러옵니다.
    if (next && all === null) {
      api
        .get<PotDto[]>("/api/manager/v1/pot")
        .then(setAll)
        .catch((err) => setError(loadError(err)));
    }
  };

  return (
    <>
      <div className="page-header">
        <h2>팟 관리</h2>
      </div>

      {error && <p className="error-text">{error}</p>}

      <div className="card" style={{ marginBottom: 16 }}>
        <h3 style={{ marginTop: 0 }}>출발 예정 하루 경과 · 미해산 팟</h3>
        {overdue === null ? (
          <p className="placeholder">불러오는 중...</p>
        ) : (
          <PotTable pots={overdue} empty="해당하는 팟이 없습니다." />
        )}
      </div>

      <div className="card">
        <button className="collapse-toggle" onClick={toggleAll}>
          <span>전체 팟</span>
          <span>{allOpen ? "접기 ▲" : "펼치기 ▼"}</span>
        </button>
        {allOpen &&
          (all === null ? (
            <p className="placeholder">불러오는 중...</p>
          ) : (
            <PotTable pots={all} empty="팟이 없습니다." />
          ))}
      </div>
    </>
  );
}
