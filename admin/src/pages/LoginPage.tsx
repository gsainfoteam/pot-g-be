import { buildIdpAuthorizeUrl } from "../lib/auth";

export function LoginPage() {
  const handleLogin = () => {
    window.location.href = buildIdpAuthorizeUrl();
  };

  return (
    <div className="login-screen">
      <div className="login-card">
        <h1>PotG Admin</h1>
        <p>Infoteam 계정으로 로그인하세요.</p>
        <button className="button" onClick={handleLogin}>
          Infoteam IDP로 로그인
        </button>
      </div>
    </div>
  );
}
