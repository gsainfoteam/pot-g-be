import { useState } from "react";
import { Link } from "react-router-dom";
import { UserPagination } from "../components/UserPagination";
import { formatDateTime } from "../lib/format";
import { useFetch } from "../lib/use-fetch";

const PAGE_SIZE = 10;

type Reservation = {
  pk: string;
  pot_pk: string;
  pot_name: string;
  type: string;
  title: string;
  send_after: string;
  created_at: string;
  status: "scheduled" | "overdue";
};

type ReservationList = {
  items: Reservation[];
  total: number;
  page: number;
  size: number;
};

type SentMessage = {
  event_id: number;
  pot_pk: string;
  pot_name: string;
  type: string;
  title: string;
  content: string;
  action_btns: string[];
  sent_at: string;
};

type SentList = {
  items: SentMessage[];
  total: number;
  page: number;
  size: number;
};

const RESERVATION_STATUS_LABELS: Record<Reservation["status"], string> = {
  scheduled: "예약됨",
  overdue: "발송 처리 대기",
};

export function PopoMessageStatusPage() {
  const [reservationPage, setReservationPage] = useState(0);
  const [sentPage, setSentPage] = useState(0);
  const reservations = useFetch<ReservationList>(
    `/api/manager/v1/popo-message-status/reservations?page=${reservationPage}&size=${PAGE_SIZE}`,
    "예약 현황을 불러오지 못했습니다.",
  );
  const sent = useFetch<SentList>(
    `/api/manager/v1/popo-message-status/sent?page=${sentPage}&size=${PAGE_SIZE}`,
    "발송 내역을 불러오지 못했습니다.",
  );

  const handleReload = () => {
    reservations.reload();
    sent.reload();
  };

  return (
    <div>
      <div className="page-header">
        <h2>포포 메시지 발송/예약 현황</h2>
        <button className="button secondary small" onClick={handleReload}>
          새로고침
        </button>
      </div>
      <p className="popo-messages-notice">
        위쪽은 아직 발송되지 않은 예약, 아래쪽은 이미 발송된 메시지입니다.
        발송된 메시지는 팟 이벤트 기록을 기준으로 하며 사용자별 푸시 성공 여부는
        포함하지 않습니다. 발송 처리 대기는 예정 시각이 지났지만 아직 처리되지
        않은 예약입니다.
      </p>

      <section className="card">
        <h3>
          발송 예약
          {reservations.data && ` (${reservations.data.total})`}
        </h3>
        {reservations.error && (
          <p className="error-text" role="alert">
            {reservations.error}
          </p>
        )}
        {!reservations.data && !reservations.error && (
          <p className="popo-message-hint">불러오는 중...</p>
        )}
        {reservations.data && reservations.data.total === 0 && (
          <p className="popo-message-hint">예약된 메시지가 없습니다.</p>
        )}
        {reservations.data && reservations.data.items.length > 0 && (
          <div className="user-table-scroll">
            <table>
              <thead>
                <tr>
                  <th>발송 예정</th>
                  <th>메시지</th>
                  <th>팟</th>
                  <th>상태</th>
                  <th>예약 생성</th>
                </tr>
              </thead>
              <tbody>
                {reservations.data.items.map((reservation) => (
                  <tr key={reservation.pk}>
                    <td>{formatDateTime(reservation.send_after)}</td>
                    <td>
                      {reservation.title}
                      <div className="popo-message-type">
                        {reservation.type}
                      </div>
                    </td>
                    <td>
                      <Link
                        className="table-link"
                        to={`/pots/${reservation.pot_pk}`}
                      >
                        {reservation.pot_name}
                      </Link>
                    </td>
                    <td>{RESERVATION_STATUS_LABELS[reservation.status]}</td>
                    <td>{formatDateTime(reservation.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {reservations.data && reservations.data.total > 0 && (
          <UserPagination
            page={reservationPage}
            size={PAGE_SIZE}
            total={reservations.data.total}
            onChange={setReservationPage}
          />
        )}
      </section>

      <section className="card">
        <h3>
          발송된 메시지
          {sent.data && ` (${sent.data.total})`}
        </h3>
        {sent.error && (
          <p className="error-text" role="alert">
            {sent.error}
          </p>
        )}
        {!sent.data && !sent.error && (
          <p className="popo-message-hint">불러오는 중...</p>
        )}
        {sent.data && sent.data.total === 0 && (
          <p className="popo-message-hint">발송된 메시지가 없습니다.</p>
        )}
        {sent.data && sent.data.items.length > 0 && (
          <div className="user-table-scroll">
            <table>
              <thead>
                <tr>
                  <th>발송 시각</th>
                  <th>메시지</th>
                  <th>팟</th>
                  <th>내용</th>
                </tr>
              </thead>
              <tbody>
                {sent.data.items.map((message) => (
                  <tr
                    key={`${message.pot_pk}-${message.sent_at}-${message.event_id}`}
                  >
                    <td>{formatDateTime(message.sent_at)}</td>
                    <td>
                      {message.title}
                      <div className="popo-message-type">{message.type}</div>
                    </td>
                    <td>
                      <Link
                        className="table-link"
                        to={`/pots/${message.pot_pk}`}
                      >
                        {message.pot_name}
                      </Link>
                    </td>
                    <td>{message.content}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {sent.data && sent.data.total > 0 && (
          <UserPagination
            page={sentPage}
            size={PAGE_SIZE}
            total={sent.data.total}
            onChange={setSentPage}
          />
        )}
      </section>
    </div>
  );
}
