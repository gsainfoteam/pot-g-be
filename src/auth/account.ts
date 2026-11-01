import {
  defineAccount,
  type SessionOf,
  type UserInfo,
} from "@gsainfoteam/account-nest";
import { z } from "zod";

// 앱(Flutter) 사용자 세션. access token 에 로그인한 기기를 함께 싣습니다.
export const userAccount = defineAccount({
  requiredScopes: ["name", "email"],
  session: {
    claims: z.object({ devicePk: z.string() }),
    paths: {
      login: "/api/v1/auth/login",
      refresh: "/api/v1/auth/refresh",
      logout: "/api/v1/auth/logout",
    },
  },
});
export const {
  AccountModule: UserAccountModule,
  AccountService: UserAccountService,
} = userAccount;
export type UserAccountService = InstanceType<typeof UserAccountService>;
export type UserSession = SessionOf<typeof userAccount>;
export type IdpUser = UserInfo<"name" | "email">;

// 관리자 웹 세션. subject 는 관리자 이메일입니다.
export const managerAccount = defineAccount({
  requiredScopes: ["email"],
  session: {
    paths: {
      login: "/api/manager/v1/auth/login",
      refresh: "/api/manager/v1/auth/refresh",
      logout: "/api/manager/v1/auth/logout",
    },
  },
});
export const {
  AccountModule: ManagerAccountModule,
  AccountService: ManagerAccountService,
} = managerAccount;
export type ManagerAccountService = InstanceType<typeof ManagerAccountService>;
export type ManagerIdpUser = UserInfo<"email">;
