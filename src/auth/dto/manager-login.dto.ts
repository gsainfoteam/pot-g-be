import { AdminAccountRole } from "@src/admin-database/entity/admin-account.entity";

export class ManagerMeResponseDto {
  email: string;
  role: AdminAccountRole;
}
