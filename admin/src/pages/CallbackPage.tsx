import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import {
  consumeStoredCodeVerifier,
  getRedirectUri,
  setAccessToken,
} from "../lib/auth";

type ManagerLoginResponse = {
  access_token: string;
};

export function CallbackPage() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const requested = useRef(false);

  useEffect(() => {
    if (requested.current) {
      return;
    }
    requested.current = true;

    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const codeVerifier = consumeStoredCodeVerifier();

    if (!code || !codeVerifier) {
      setError("인증 코드가 없습니다.");
      return;
    }

    api
      .post<ManagerLoginResponse>("/api/manager/v1/auth/login", {
        code,
        redirect_uri: getRedirectUri(),
        code_verifier: codeVerifier,
      })
      .then((res) => {
        setAccessToken(res.access_token);
        navigate("/", { replace: true });
      })
      .catch(() => {
        setError(
          "로그인에 실패했습니다. 관리자 계정으로 등록되어 있는지 확인해주세요.",
        );
      });
  }, [navigate]);

  return (
    <div className="login-screen">
      <div className="login-card">
        {error ? (
          <>
            <h1>로그인 실패</h1>
            <p className="error-text">{error}</p>
            <a className="button secondary" href="/login">
              다시 로그인
            </a>
          </>
        ) : (
          <p>로그인 처리 중...</p>
        )}
      </div>
    </div>
  );
}
