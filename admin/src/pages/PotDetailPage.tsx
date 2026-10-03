import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api, ApiError } from "../lib/api";
import { formatDateTime } from "../lib/format";
import { EVENT_TYPE_LABEL, POT_STATUS_LABEL } from "../lib/pot";

type PotEventDto = {
  id: number;
  timestamp: string;
  event_type: string;
  data: unknown;
};

type PotDetailDto = {
  pk: string;
  name: string;
  route_name: string;
  status: string;
  is_archived: boolean;
  is_deleted: boolean;
  total: number;
  starts_at: string;
  ends_at: string;
  departure_time: string | null;
  created_at: string;
  updated_at: string;
  host_user_pk: string | null;
  joined_user_pks: string[];
  accounting: {
    requested_by_user_pk: string | null;
    total_cost: number | null;
    cost_per_user: number | null;
    bank_name: string | null;
    pending_user_pks: string[];
    confirmed_user_pks: string[];
  } | null;
  users: Record<string, string>;
  events: PotEventDto[];
};

const UUID_PATTERN =
  /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;

export function PotDetailPage() {
  const { pk } = useParams();
  const [pot, setPot] = useState<PotDetailDto | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<PotDetailDto>(`/api/manager/v1/pot/${pk}`)
      .then(setPot)
      .catch((err) =>
        setError(
          err instanceof ApiError
            ? `팟 정보를 불러오지 못했습니다. (${err.status})`
            : "팟 정보를 불러오지 못했습니다.",
        ),
      );
  }, [pk]);

  const nameOf = (userPk: string | null) =>
    userPk ? (pot?.users[userPk] ?? userPk) : "-";
  const namesOf = (userPks: string[]) =>
    userPks.length > 0 ? userPks.map(nameOf).join(", ") : "-";
  // 이벤트 데이터 안의 유저 UUID 를 이름으로 바꿔서 보여줍니다.
  const renderData = (data: unknown) =>
    JSON.stringify(data).replace(
      UUID_PATTERN,
      (match) => pot?.users[match] ?? match,
    );

  return (
    <>
      <div className="page-header">
        <h2>팟 상세</h2>
        <Link to="/pots" className="button secondary small">
          목록으로
        </Link>
      </div>

      {error && <p className="error-text">{error}</p>}
      {!pot && !error && <p className="placeholder">불러오는 중...</p>}

      {pot && (
        <>
          <div className="card" style={{ marginBottom: 16 }}>
            <h3 style={{ marginTop: 0 }}>{pot.name}</h3>
            <dl className="info-grid">
              <dt>상태</dt>
              <dd>{POT_STATUS_LABEL[pot.status] ?? pot.status}</dd>
              <dt>노선</dt>
              <dd>{pot.route_name}</dd>
              <dt>방장</dt>
              <dd>{nameOf(pot.host_user_pk)}</dd>
              <dt>참여자</dt>
              <dd>
                ({pot.joined_user_pks.length}/{pot.total}){" "}
                {namesOf(pot.joined_user_pks)}
              </dd>
              <dt>출발 가능 시간</dt>
              <dd>
                {formatDateTime(pot.starts_at)} ~ {formatDateTime(pot.ends_at)}
              </dd>
              <dt>확정 출발 시간</dt>
              <dd>
                {pot.departure_time ? formatDateTime(pot.departure_time) : "-"}
              </dd>
              <dt>생성 / 수정</dt>
              <dd>
                {formatDateTime(pot.created_at)} /{" "}
                {formatDateTime(pot.updated_at)}
              </dd>
            </dl>
          </div>

          {pot.accounting && (
            <div className="card" style={{ marginBottom: 16 }}>
              <h3 style={{ marginTop: 0 }}>정산</h3>
              <dl className="info-grid">
                <dt>정산 요청자</dt>
                <dd>{nameOf(pot.accounting.requested_by_user_pk)}</dd>
                <dt>총 금액</dt>
                <dd>
                  {pot.accounting.total_cost?.toLocaleString("ko-KR") ?? "-"}원
                </dd>
                <dt>1인당 금액</dt>
                <dd>
                  {pot.accounting.cost_per_user?.toLocaleString("ko-KR") ?? "-"}
                  원
                </dd>
                <dt>은행</dt>
                <dd>{pot.accounting.bank_name ?? "-"}</dd>
                <dt>송금 대기</dt>
                <dd>{namesOf(pot.accounting.pending_user_pks)}</dd>
                <dt>송금 완료</dt>
                <dd>{namesOf(pot.accounting.confirmed_user_pks)}</dd>
              </dl>
            </div>
          )}

          <div className="card">
            <h3 style={{ marginTop: 0 }}>이벤트 (채팅 제외)</h3>
            <table>
              <thead>
                <tr>
                  <th>시간</th>
                  <th>종류</th>
                  <th>내용</th>
                </tr>
              </thead>
              <tbody>
                {pot.events.map((event) => (
                  <tr key={`${event.timestamp}-${event.id}`}>
                    <td className="nowrap">
                      {formatDateTime(event.timestamp)}
                    </td>
                    <td className="nowrap">
                      {EVENT_TYPE_LABEL[event.event_type] ?? event.event_type}
                    </td>
                    <td>
                      <code className="event-data">
                        {renderData(event.data)}
                      </code>
                    </td>
                  </tr>
                ))}
                {pot.events.length === 0 && (
                  <tr>
                    <td colSpan={3} className="placeholder">
                      이벤트가 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  );
}
