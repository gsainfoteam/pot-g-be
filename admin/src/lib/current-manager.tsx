import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { api, ApiError } from "./api";

export type CurrentManager = { email: string; role: number };

const CurrentManagerContext = createContext<CurrentManager | null>(null);

// 로그인 직후 한 번 현재 계정 정보를 조회해서 하위 화면에서 공유합니다.
export function CurrentManagerProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [manager, setManager] = useState<CurrentManager | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setError(null);
    api
      .get<CurrentManager>("/api/manager/v1/auth/me")
      .then(setManager)
      .catch((err) =>
        setError(
          err instanceof ApiError
            ? `계정 정보를 불러오지 못했습니다. (${err.status})`
            : "계정 정보를 불러오지 못했습니다.",
        ),
      );
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (error) {
    return (
      <>
        <p className="error-text">{error}</p>
        <button className="button secondary small" onClick={load}>
          다시 시도
        </button>
      </>
    );
  }
  if (!manager) return <p className="placeholder">불러오는 중...</p>;

  return (
    <CurrentManagerContext.Provider value={manager}>
      {children}
    </CurrentManagerContext.Provider>
  );
}

export function useCurrentManager(): CurrentManager {
  const manager = useContext(CurrentManagerContext);
  if (!manager) {
    throw new Error(
      "useCurrentManager must be used inside CurrentManagerProvider",
    );
  }
  return manager;
}
