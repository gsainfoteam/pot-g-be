const TOKEN_KEY = "potg_admin_access_token";

export function getAccessToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setAccessToken(token: string): void {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    // localStorage를 사용할 수 없는 환경(프라이빗 모드 등)은 무시합니다.
  }
}

export function clearAccessToken(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    // ignore
  }
}

export function isLoggedIn(): boolean {
  return !!getAccessToken();
}

export function buildIdpAuthorizeUrl(): string {
  const idpUrl = import.meta.env.VITE_IDP_URL;
  const clientId = import.meta.env.VITE_IDP_CLIENT_ID;
  const redirectUri = `${window.location.origin}/callback`;

  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: "name email",
  });

  return `${idpUrl}/oauth/authorize?${params.toString()}`;
}

export function getRedirectUri(): string {
  return `${window.location.origin}/callback`;
}
