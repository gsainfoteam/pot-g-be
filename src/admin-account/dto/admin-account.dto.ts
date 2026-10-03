import { AdminAccountRole } from "@src/admin-database/entity/admin-account.entity";

export class AdminAccountDto {
  pk: string;
  email: string;
  role: AdminAccountRole;
  created_at: Date;
}
