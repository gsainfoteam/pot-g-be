export enum AdminAccountRole {
  admin = 0,
  superadmin = 1,
}

export class AdminAccountEntity {
  pk?: string;
  email: string;
  role: AdminAccountRole;
  createdAt?: Date;
  updatedAt?: Date;
}
