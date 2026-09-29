const TOKEN_KEY = "potg_admin_access_token";
const PKCE_VERIFIER_KEY = "potg_admin_pkce_verifier";

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

function generateCodeVerifier(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export function buildIdpAuthorizeUrl(): string {
  const authorizeUrl = import.meta.env.VITE_IDP_AUTHORIZE_URL;
  const clientId = import.meta.env.VITE_IDP_CLIENT_ID;

  // 이 IDP는 code_challenge_method=plain을 쓰므로 code_verifier를 그대로
  // code_challenge로 보내고, 콜백에서 같은 값을 code_verifier로 다시 보냅니다.
  const codeVerifier = generateCodeVerifier();
  try {
    sessionStorage.setItem(PKCE_VERIFIER_KEY, codeVerifier);
  } catch {
    // ignore
  }

  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: getRedirectUri(),
    scope: "profile email",
    code_challenge: codeVerifier,
    code_challenge_method: "plain",
  });

  return `${authorizeUrl}?${params.toString()}`;
}

export function consumeStoredCodeVerifier(): string | null {
  try {
    const verifier = sessionStorage.getItem(PKCE_VERIFIER_KEY);
    sessionStorage.removeItem(PKCE_VERIFIER_KEY);
    return verifier;
  } catch {
    return null;
  }
}

export function getRedirectUri(): string {
  return `${window.location.origin}/callback`;
}
