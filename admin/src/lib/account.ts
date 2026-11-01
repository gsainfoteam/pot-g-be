import { createAccountClient } from "@gsainfoteam/account-web";
import { useSyncExternalStore } from "react";

// 라우터보다 먼저 만들어야 IdP callback 주소를 로그인 전 위치로 바꿀 수 있습니다. main.tsx 가 가장 먼저 import 합니다.
export const account = createAccountClient({
  issuer: import.meta.env.VITE_ACCOUNT_ISSUER,
  clientId: import.meta.env.VITE_ACCOUNT_CLIENT_ID,
  api: {
    baseUrl: window.location.origin,
    paths: {
      login: "/api/manager/v1/auth/login",
      refresh: "/api/manager/v1/auth/refresh",
      logout: "/api/manager/v1/auth/logout",
    },
  },
});

export function useAccountState() {
  return useSyncExternalStore(account.store.subscribe, account.store.getState);
}
