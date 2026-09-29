export type AdminAccountRole = "admin" | "superadmin";

export class AdminAccountEntity {
  pk?: string;
  email: string;
  role: AdminAccountRole;
  createdAt?: Date;
  updatedAt?: Date;
}
