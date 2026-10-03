import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, ApiError } from "../lib/api";
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
            <td>{pot.name}</td>
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

function loadError(err: unknown): string {
  return err instanceof ApiError
    ? `팟 목록을 불러오지 못했습니다. (${err.status})`
    : "팟 목록을 불러오지 못했습니다.";
}

type PotListDto = {
  items: PotDto[];
  total: number;
  page: number;
  size: number;
};

const PAGE_SIZE = 10;
const SEARCH_DEBOUNCE_MS = 300;

export function PotsPage() {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [overdue, setOverdue] = useState<PotDto[] | null>(null);
  const [active, setActive] = useState<PotListDto | null>(null);
  const [activePage, setActivePage] = useState(0);
  const [all, setAll] = useState<PotListDto | null>(null);
  const [allOpen, setAllOpen] = useState(false);
  const [page, setPage] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // 입력이 멈춘 뒤에만 검색어를 반영하고, 검색어가 바뀌면 첫 페이지로 돌아갑니다.
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(0);
      setActivePage(0);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    let cancelled = false;
    api
      .get<PotDto[]>(
        `/api/manager/v1/pot/overdue?${new URLSearchParams({ search })}`,
      )
      .then((data) => {
        if (!cancelled) {
          setOverdue(data);
          setError(null);
        }
      })
      .catch((err) => !cancelled && setError(loadError(err)));
    return () => {
      cancelled = true;
    };
  }, [search]);

  useEffect(() => {
    let cancelled = false;
    api
      .get<PotListDto>(
        `/api/manager/v1/pot/active?${new URLSearchParams({
          search,
          page: String(activePage),
          size: String(PAGE_SIZE),
        })}`,
      )
      .then((data) => {
        if (!cancelled) {
          setActive(data);
          setError(null);
        }
      })
      .catch((err) => !cancelled && setError(loadError(err)));
    return () => {
      cancelled = true;
    };
  }, [search, activePage]);

  // 접혀 있는 동안에는 전체 목록을 불러오지 않습니다.
  useEffect(() => {
    if (!allOpen) return;
    let cancelled = false;
    api
      .get<PotListDto>(
        `/api/manager/v1/pot?${new URLSearchParams({
          search,
          page: String(page),
          size: String(PAGE_SIZE),
        })}`,
      )
      .then((data) => {
        if (!cancelled) {
          setAll(data);
          setError(null);
        }
      })
      .catch((err) => !cancelled && setError(loadError(err)));
    return () => {
      cancelled = true;
    };
  }, [allOpen, search, page]);

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

      {error && <p className="error-text">{error}</p>}

      <div className="card" style={{ marginBottom: 16 }}>
        <h3 style={{ marginTop: 0 }}>출발 예정 하루 경과 · 미해산 팟</h3>
        {overdue === null ? (
          <p className="placeholder">불러오는 중...</p>
        ) : (
          <PotTable pots={overdue} empty="해당하는 팟이 없습니다." />
        )}
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <h3 style={{ marginTop: 0 }}>
          진행 중인 팟 (미해산){active ? ` (${active.total})` : ""}
        </h3>
        {active === null ? (
          <p className="placeholder">불러오는 중...</p>
        ) : (
          <>
            <PotTable pots={active.items} empty="진행 중인 팟이 없습니다." />
            <Pagination
              page={activePage}
              total={active.total}
              size={active.size}
              onChange={setActivePage}
            />
          </>
        )}
      </div>

      <div className="card">
        <button
          className="collapse-toggle"
          onClick={() => setAllOpen((open) => !open)}
        >
          <span>전체 팟{all && allOpen ? ` (${all.total})` : ""}</span>
          <span>{allOpen ? "접기 ▲" : "펼치기 ▼"}</span>
        </button>
        {allOpen &&
          (all === null ? (
            <p className="placeholder">불러오는 중...</p>
          ) : (
            <>
              <PotTable pots={all.items} empty="팟이 없습니다." />
              <Pagination
                page={page}
                total={all.total}
                size={all.size}
                onChange={setPage}
              />
            </>
          ))}
      </div>
    </>
  );
}
