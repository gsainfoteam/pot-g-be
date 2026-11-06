import { useState } from "react";
import { buildIdpAuthorizeUrl } from "../lib/auth";

export function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    if (loading) {
      return;
    }
    setLoading(true);
    setError(null);

    try {
      window.location.href = await buildIdpAuthorizeUrl();
    } catch {
      setLoading(false);
      setError(
        "로그인 요청을 만들지 못했습니다. HTTPS 또는 localhost로 접속했는지 확인한 뒤 다시 시도해주세요.",
      );
    }
  };

  return (
    <div className="login-screen">
      <div className="login-card">
        <h1>PotG Admin</h1>
        <p>Infoteam 계정으로 로그인하세요.</p>
        {error && <p className="error-text">{error}</p>}
        <button className="button" onClick={handleLogin} disabled={loading}>
          Infoteam IDP로 로그인
        </button>
      </div>
    </div>
  );
}
