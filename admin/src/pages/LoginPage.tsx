import { Navigate } from "react-router-dom";
import { account, useAccountState } from "../lib/account";

export function LoginPage() {
  const { status, error } = useAccountState();

  if (status === "authenticated") {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="login-screen">
      <div className="login-card">
        <h1>PotG Admin</h1>
        <p>Infoteam 계정으로 로그인하세요.</p>
        {error && (
          <p className="error-text">
            로그인에 실패했습니다. 관리자 계정으로 등록되어 있는지 확인해주세요.
          </p>
        )}
        <button
          className="button"
          disabled={status === "loading"}
          onClick={() => account.login({ returnTo: "/" })}
        >
          Infoteam IDP로 로그인
        </button>
      </div>
    </div>
  );
}
