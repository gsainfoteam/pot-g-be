import {
  defineAccount,
  type SessionOf,
  type UserInfo,
} from "@gsainfoteam/account-nest";
import { z } from "zod";

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
