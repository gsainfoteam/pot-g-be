import { Link, useNavigate } from "react-router-dom";
import { formatDateTime } from "../lib/format";
import { PotStatusBadge } from "./PotStatusBadge";

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

export function PotTable({ pots, empty }: { pots: PotDto[]; empty: string }) {
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
            <td>
              {/* 행 전체 클릭은 마우스용이고, 키보드/스크린리더는 이 링크로 이동합니다. */}
              <Link
                className="table-link"
                to={`/pots/${pot.pk}`}
                onClick={(e) => e.stopPropagation()}
              >
                {pot.name}
              </Link>
            </td>
            <td>{pot.route_name}</td>
            <td>
              <PotStatusBadge status={pot.status} />
            </td>
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
