import { useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useFetch } from "../lib/use-fetch";
import { formatDateTime } from "../lib/format";
import { UserPagination } from "../components/UserPagination";

type UserItem = {
  pk: string;
  name: string | null;
  email: string | null;
  is_deleted: boolean;
  created_at: string;
};
type UserList = {
  items: UserItem[];
  total: number;
  page: number;
  size: number;
};

export function UsersPage() {
  const [params] = useSearchParams();
  return <UserListContent key={params.toString()} />;
}

function UserListContent() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const status = ["active", "withdrawn", "all"].includes(
    params.get("status") ?? "",
  )
    ? params.get("status")!
    : "active";
  const rawPage = Number(params.get("page") ?? 0);
  const page = Number.isSafeInteger(rawPage) && rawPage >= 0 ? rawPage : 0;
  const [field, setField] = useState(
    params.has("email") ? "email" : params.has("idp_sub") ? "idp_sub" : "pk",
  );
  const [search, setSearch] = useState(
    params.get("pk") ?? params.get("idp_sub") ?? params.get("email") ?? "",
  );
  const [filter, setFilter] = useState(status);
  const query = new URLSearchParams({ status, page: String(page), size: "10" });
  for (const key of ["pk", "idp_sub", "email"]) {
    if (params.get(key)) query.set(key, params.get(key)!);
  }
  const list = useFetch<UserList>(
    `/api/manager/v1/user?${query}`,
    "회원 목록을 불러오지 못했습니다.",
  );
  function submit(event: FormEvent) {
    event.preventDefault();
    const value = search.trim();
    const next = new URLSearchParams({ status: filter });
    if (value) next.set(field, value);
    if (next.toString() === params.toString()) list.reload();
    else setParams(next);
  }
  function changePage(next: number) {
    const updated = new URLSearchParams(params);
    updated.set("page", String(next));
    setParams(updated);
  }
  const back = `/users${params.size ? `?${params}` : ""}`;
  return (
    <>
      <div className="page-header">
        <h2>사용자</h2>
        <button className="button secondary small" onClick={list.reload}>
          새로고침
        </button>
      </div>
      <form className="inline-form user-search" onSubmit={submit}>
        <label>
          검색 기준
          <select
            value={field}
            onChange={(e) => {
              setField(e.target.value);
            }}
          >
            <option value="pk">회원 ID</option>
            <option value="email">이메일</option>
            <option value="idp_sub">IDP Sub</option>
          </select>
        </label>
        <label className="user-search-value">
          검색어
          <input
            value={search}
            maxLength={64}
            placeholder={
              field === "pk"
                ? "회원 ID의 일부 또는 전체 입력"
                : field === "email"
                  ? "이메일의 일부 또는 전체 입력"
                  : "IDP Sub의 일부 또는 전체 입력"
            }
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
        <label>
          회원 상태
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="active">이용 중인 회원</option>
            <option value="withdrawn">탈퇴 회원</option>
            <option value="all">전체 회원</option>
          </select>
        </label>
        <button className="button small" type="submit">
          검색
        </button>
        <button
          className="button secondary small"
          type="button"
          onClick={() => {
            if (params.size) setParams({});
            else {
              setSearch("");
              setField("pk");
              setFilter("active");
              list.reload();
            }
          }}
        >
          초기화
        </button>
      </form>
      <div className="card" aria-busy={!list.data && !list.error}>
        {list.error ? (
          <div role="alert">
            <p className="error-text">{list.error}</p>
            <button className="button secondary small" onClick={list.reload}>
              다시 시도
            </button>
          </div>
        ) : !list.data ? (
          <p className="placeholder" role="status">
            불러오는 중...
          </p>
        ) : (
          <>
            <h3 className="user-section-title">
              회원 목록 ({list.data.total}명)
            </h3>
            <div className="user-table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>이름</th>
                    <th>이메일</th>
                    <th>회원 ID</th>
                    <th>상태</th>
                    <th>가입일</th>
                  </tr>
                </thead>
                <tbody>
                  {list.data.items.map((user) => (
                    <tr
                      key={user.pk}
                      className="clickable-row"
                      onClick={() =>
                        navigate(`/users/${user.pk}`, { state: { from: back } })
                      }
                    >
                      <td>
                        <Link
                          className="table-link"
                          to={`/users/${user.pk}`}
                          state={{ from: back }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {user.name ??
                            (user.is_deleted ? "탈퇴 회원" : "이름 없음")}
                        </Link>
                      </td>
                      <td>{user.email ?? "-"}</td>
                      <td className="user-identifier">{user.pk}</td>
                      <td>{user.is_deleted ? "탈퇴" : "이용 중"}</td>
                      <td>{formatDateTime(user.created_at)}</td>
                    </tr>
                  ))}
                  {!list.data.items.length && (
                    <tr>
                      <td colSpan={5} className="placeholder">
                        조건에 맞는 회원이 없습니다.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <UserPagination
              page={page}
              size={list.data.size}
              total={list.data.total}
              onChange={changePage}
            />
          </>
        )}
      </div>
    </>
  );
}
