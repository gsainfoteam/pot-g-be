import { useState } from "react";

type Props = {
  title: string;
  refreshable?: boolean;
};

export function PlaceholderPage({ title, refreshable = false }: Props) {
  const [refreshedAt, setRefreshedAt] = useState<Date | null>(null);

  return (
    <>
      <div className="page-header">
        <h2>{title}</h2>
        {refreshable && (
          <button
            className="button secondary"
            onClick={() => setRefreshedAt(new Date())}
          >
            새로고침
          </button>
        )}
      </div>
      <div className="card">
        <p className="placeholder">
          아직 구현되지 않았습니다.
          {refreshedAt && (
            <> (마지막 새로고침: {refreshedAt.toLocaleTimeString()})</>
          )}
        </p>
      </div>
    </>
  );
}
