import { useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { useFetch } from "../lib/use-fetch";
import { formatDateTime } from "../lib/format";
import { PotTable, type PotDto } from "../components/PotTable";
import { UserPagination } from "../components/UserPagination";

type UserDetail = {
  pk: string;
  idp_sub: string;
  name: string | null;
  email: string | null;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  devices: {
    pk: string;
    os: string;
    version: string;
    logged_in: boolean;
    has_fcm_token: boolean;
    push_setting: {
      chat_push: boolean;
      marketing_push: boolean;
      pot_in_out_push: boolean;
    } | null;
  }[];
};
type PotList = { items: PotDto[]; total: number; page: number; size: number };

export function UserDetailPage() {
  const { pk } = useParams();
  return <UserDetailContent key={pk} pk={pk!} />;
}

function UserDetailContent({ pk }: { pk: string }) {
  const location = useLocation();
  const from: unknown = location.state?.from;
  const back =
    typeof from === "string" &&
    (from === "/users" || from.startsWith("/users?"))
      ? from
      : "/users";
  const user = useFetch<UserDetail>(
    `/api/manager/v1/user/${pk}`,
    "회원 정보를 불러오지 못했습니다.",
  );
  const [page, setPage] = useState(0);
  const pots = useFetch<PotList>(
    user.data ? `/api/manager/v1/user/${pk}/pots?page=${page}&size=10` : null,
    "참여 팟을 불러오지 못했습니다.",
  );
  return (
    <>
      <div className="page-header">
        <h2>회원 상세</h2>
        <Link className="button secondary small" to={back}>
          목록으로
        </Link>
      </div>
      {user.error ? (
        <div role="alert">
          <p className="error-text">{user.error}</p>
          <button className="button secondary small" onClick={user.reload}>
            다시 시도
          </button>
        </div>
      ) : !user.data ? (
        <p className="placeholder" role="status">
          불러오는 중...
        </p>
      ) : (
        <div className="user-detail-sections">
          <section className="card">
            <h3 className="user-section-title">회원 정보</h3>
            <dl className="info-grid user-info">
              <dt>이름</dt>
              <dd>
                {user.data.name ?? (user.data.is_deleted ? "탈퇴 회원" : "-")}
              </dd>
              <dt>상태</dt>
              <dd>{user.data.is_deleted ? "탈퇴" : "이용 중"}</dd>
              <dt>이메일</dt>
              <dd>{user.data.email ?? "-"}</dd>
              <dt>회원 ID</dt>
              <dd className="user-identifier">{user.data.pk}</dd>
              <dt>IDP Sub</dt>
              <dd className="user-identifier">{user.data.idp_sub}</dd>
              <dt>가입일</dt>
              <dd>{formatDateTime(user.data.created_at)}</dd>
              <dt>수정일</dt>
              <dd>{formatDateTime(user.data.updated_at)}</dd>
            </dl>
          </section>
          <section className="card">
            <h3 className="user-section-title">
              기기 및 푸시 설정 ({user.data.devices.length})
            </h3>
            <div className="user-table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>기기 ID</th>
                    <th>운영체제 / 앱 버전</th>
                    <th>로그인 상태</th>
                    <th>푸시 토큰 등록</th>
                    <th>채팅 알림</th>
                    <th>마케팅 알림</th>
                    <th>팟 입퇴장 알림</th>
                  </tr>
                </thead>
                <tbody>
                  {user.data.devices.map((device) => (
                    <tr key={device.pk}>
                      <td className="user-identifier">{device.pk}</td>
                      <td>
                        {device.os} / {device.version}
                      </td>
                      <td>{device.logged_in ? "로그인" : "로그아웃"}</td>
                      <td>{device.has_fcm_token ? "등록됨" : "미등록"}</td>
                      <td>
                        {device.push_setting
                          ? device.push_setting.chat_push
                            ? "수신함"
                            : "수신 안 함"
                          : "설정 없음"}
                      </td>
                      <td>
                        {device.push_setting
                          ? device.push_setting.marketing_push
                            ? "수신함"
                            : "수신 안 함"
                          : "설정 없음"}
                      </td>
                      <td>
                        {device.push_setting
                          ? device.push_setting.pot_in_out_push
                            ? "수신함"
                            : "수신 안 함"
                          : "설정 없음"}
                      </td>
                    </tr>
                  ))}
                  {!user.data.devices.length && (
                    <tr>
                      <td colSpan={7} className="placeholder">
                        등록된 기기가 없습니다.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
          <section className="card">
            <div className="page-header">
              <h3 className="user-section-title">
                참여 팟{pots.data ? ` (${pots.data.total})` : ""}
              </h3>
              <button className="button secondary small" onClick={pots.reload}>
                새로고침
              </button>
            </div>
            {pots.error ? (
              <div role="alert">
                <p className="error-text">{pots.error}</p>
                <button
                  className="button secondary small"
                  onClick={pots.reload}
                >
                  다시 시도
                </button>
              </div>
            ) : !pots.data ? (
              <p className="placeholder" role="status">
                불러오는 중...
              </p>
            ) : (
              <>
                <div className="user-table-scroll">
                  <PotTable
                    pots={pots.data.items}
                    empty="참여한 팟이 없습니다."
                  />
                </div>
                <UserPagination
                  page={page}
                  total={pots.data.total}
                  size={pots.data.size}
                  onChange={setPage}
                />
              </>
            )}
          </section>
        </div>
      )}
    </>
  );
}
