import { AdminAccountRole } from "@src/admin-database/entity/admin-account.entity";

export class ManagerContext {
  private readonly _email: string;
  private readonly _role: AdminAccountRole;

  get email(): string {
    return this._email;
  }

  get role(): AdminAccountRole {
    return this._role;
  }

  constructor(email: string, role: AdminAccountRole) {
    this._email = email;
    this._role = role;
  }
}
