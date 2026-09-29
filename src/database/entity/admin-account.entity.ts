export type AdminAccountRole = "admin" | "superadmin";

export class AdminAccountEntity {
  pk?: string;
  email: string;
  role: AdminAccountRole;
  memo?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}
