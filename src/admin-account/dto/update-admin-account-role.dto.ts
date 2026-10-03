import { IsEnum } from "class-validator";
import { AdminAccountRole } from "@src/database/entity/admin-account.entity";

export class UpdateAdminAccountRoleRequestDto {
  @IsEnum(AdminAccountRole)
  role: AdminAccountRole;
}
