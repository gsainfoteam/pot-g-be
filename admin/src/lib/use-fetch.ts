import { useEffect, useState } from "react";
import { api, ApiError } from "./api";

type FetchState<T> = { data: T | null; error: string | null };

/**
 * path 가 바뀔 때마다 다시 조회합니다. 요청 중이거나 실패한 동안에는 data 가 null 이라
 * 이전 요청의 결과가 현재 결과처럼 보이지 않고, 이전 요청의 응답은 무시합니다.
 * path 가 null 이면 조회하지 않습니다.
 */
export function useFetch<T>(path: string | null, errorMessage: string) {
  const [state, setState] = useState<FetchState<T>>({
    data: null,
    error: null,
  });
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (path === null) return;
    let cancelled = false;

    setState({ data: null, error: null });
    api
      .get<T>(path)
      .then((data) => {
        if (!cancelled) setState({ data, error: null });
      })
      .catch((err) => {
        if (cancelled) return;
        setState({
          data: null,
          error:
            err instanceof ApiError
              ? `${errorMessage} (${err.status})`
              : errorMessage,
        });
      });

    return () => {
      cancelled = true;
    };
  }, [path, errorMessage, reloadKey]);

  return { ...state, reload: () => setReloadKey((key) => key + 1) };
}
