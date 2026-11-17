import { useState } from "react";
import { api } from "../lib/api";

type CleanupResult = {
  archived_count: number;
  archived_pot_pks: string[];
};

export function PotCleanupPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CleanupResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleRunCleanup = async () => {
    if (
      !window.confirm(
        "정산 요청 인원이 0명인 미해산 팟들을 일괄 해산하시겠습니까?",
      )
    ) {
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await api.post<CleanupResult>(
        "/api/manager/v1/pot/archive-zero-target",
      );
      setResult(res);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "작업 실행 중 오류가 발생했습니다.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="page-header">
        <h2>일회성 팟 정리</h2>
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>정산 대상 0명 팟 일괄 해산</h3>
        <p>
          정산 요청이 진행되었으나 정산 요청 인원이 0명이어서 자동 해산되지 않고
          남아있는 기존 팟들을 찾아 일괄 해산(Archive) 처리합니다.
        </p>
        <button
          className="button"
          onClick={handleRunCleanup}
          disabled={loading}
        >
          {loading ? "실행 중..." : "해산 작업 실행"}
        </button>

        {error && (
          <p className="error-text" style={{ marginTop: 16 }}>
            {error}
          </p>
        )}

        {result && (
          <div style={{ marginTop: 16 }}>
            <p>
              <strong>처리 완료:</strong> 총 {result.archived_count}개의 팟이
              해산되었습니다.
            </p>
            {result.archived_pot_pks.length > 0 && (
              <ul>
                {result.archived_pot_pks.map((pk) => (
                  <li key={pk}>{pk}</li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </>
  );
}
