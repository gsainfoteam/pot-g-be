import { IsEnum } from "class-validator";
import { AdminAccountRole } from "@src/admin-database/entity/admin-account.entity";

export class UpdateAdminAccountRoleRequestDto {
  @IsEnum(AdminAccountRole)
  role: AdminAccountRole;
}
