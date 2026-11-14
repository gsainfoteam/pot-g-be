export function UserPagination({
  page,
  size,
  total,
  onChange,
}: {
  page: number;
  size: number;
  total: number;
  onChange: (page: number) => void;
}) {
  const pages = Math.max(1, Math.ceil(total / size));
  return (
    <nav className="pagination" aria-label="페이지 이동">
      <button
        className="button secondary small"
        disabled={page === 0}
        onClick={() => onChange(page - 1)}
      >
        이전
      </button>
      <span aria-live="polite">
        {page + 1} / {Math.max(pages, page + 1)}
      </span>
      <button
        className="button secondary small"
        disabled={page + 1 >= pages}
        onClick={() => onChange(page + 1)}
      >
        다음
      </button>
    </nav>
  );
}
