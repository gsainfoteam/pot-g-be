import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useFetch } from "../lib/use-fetch";
import { formatDateTime } from "../lib/format";
import { PotStatusBadge } from "../components/PotStatusBadge";

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

function Pagination({
  page,
  total,
  size,
  onChange,
}: {
  page: number;
  total: number;
  size: number;
  onChange: (page: number) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(total / size));

  return (
    <div className="pagination">
      <button
        className="button secondary small"
        disabled={page === 0}
        onClick={() => onChange(page - 1)}
      >
        이전
      </button>
      <span>
        {page + 1} / {totalPages}
      </span>
      <button
        className="button secondary small"
        disabled={page + 1 >= totalPages}
        onClick={() => onChange(page + 1)}
      >
        다음
      </button>
    </div>
  );
}

type PotListDto = {
  items: PotDto[];
  total: number;
  page: number;
  size: number;
};

const PAGE_SIZE = 10;
const SEARCH_DEBOUNCE_MS = 300;

const LIST_ERROR = "팟 목록을 불러오지 못했습니다.";

function listPath(base: string, search: string, page: number): string {
  return `${base}?${new URLSearchParams({
    search,
    page: String(page),
    size: String(PAGE_SIZE),
  })}`;
}

// 목록 카드의 본문. 요청 중/실패/성공을 구분해서, 이전 요청의 결과가 남아 보이지 않게 합니다.
function ListBody<T>({
  state,
  children,
}: {
  state: { data: T | null; error: string | null; reload: () => void };
  children: (data: T) => React.ReactNode;
}) {
  if (state.error) {
    return (
      <>
        <p className="error-text">{state.error}</p>
        <button className="button secondary small" onClick={state.reload}>
          다시 시도
        </button>
      </>
    );
  }
  if (state.data === null) return <p className="placeholder">불러오는 중...</p>;
  return <>{children(state.data)}</>;
}

export function PotsPage() {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [activePage, setActivePage] = useState(0);
  const [allOpen, setAllOpen] = useState(false);
  const [page, setPage] = useState(0);

  // 입력이 멈춘 뒤에만 검색어를 반영하고, 검색어가 바뀌면 첫 페이지로 돌아갑니다.
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(0);
      setActivePage(0);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const overdue = useFetch<PotDto[]>(
    `/api/manager/v1/pot/overdue?${new URLSearchParams({ search })}`,
    LIST_ERROR,
  );
  const active = useFetch<PotListDto>(
    listPath("/api/manager/v1/pot/active", search, activePage),
    LIST_ERROR,
  );
  // 접혀 있는 동안에는 전체 목록을 불러오지 않습니다.
  const all = useFetch<PotListDto>(
    allOpen ? listPath("/api/manager/v1/pot", search, page) : null,
    LIST_ERROR,
  );

  return (
    <>
      <div className="page-header">
        <h2>팟 관리</h2>
      </div>

      <div className="inline-form">
        <input
          className="search-input"
          value={searchInput}
          placeholder="팟 이름 또는 ID로 검색"
          onChange={(e) => setSearchInput(e.target.value)}
        />
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <h3 style={{ marginTop: 0 }}>출발 예정 하루 경과 · 미해산 팟</h3>
        <ListBody state={overdue}>
          {(pots) => <PotTable pots={pots} empty="해당하는 팟이 없습니다." />}
        </ListBody>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <h3 style={{ marginTop: 0 }}>
          진행 중인 팟 (미해산){active.data ? ` (${active.data.total})` : ""}
        </h3>
        <ListBody state={active}>
          {(list) => (
            <>
              <PotTable pots={list.items} empty="진행 중인 팟이 없습니다." />
              <Pagination
                page={activePage}
                total={list.total}
                size={list.size}
                onChange={setActivePage}
              />
            </>
          )}
        </ListBody>
      </div>

      <div className="card">
        <button
          className="collapse-toggle"
          onClick={() => setAllOpen((open) => !open)}
        >
          <span>
            전체 팟{all.data && allOpen ? ` (${all.data.total})` : ""}
          </span>
          <span>{allOpen ? "접기 ▲" : "펼치기 ▼"}</span>
        </button>
        {allOpen && (
          <ListBody state={all}>
            {(list) => (
              <>
                <PotTable pots={list.items} empty="팟이 없습니다." />
                <Pagination
                  page={page}
                  total={list.total}
                  size={list.size}
                  onChange={setPage}
                />
              </>
            )}
          </ListBody>
        )}
      </div>
    </>
  );
}
