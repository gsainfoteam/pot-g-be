import { AdminAccountRole } from "@src/admin-database/entity/admin-account.entity";

export type ManagerAccessTokenJwtPayload = {
  email: string;
  role: AdminAccountRole;
};
