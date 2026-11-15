import { ApiProperty } from "@nestjs/swagger";
import { IsEnum } from "class-validator";
import { AdminAccountRole } from "@src/admin-database/entity/admin-account.entity";

export class UpdateAdminAccountRoleRequestDto {
  @ApiProperty({ enum: AdminAccountRole, enumName: "AdminAccountRole" })
  @IsEnum(AdminAccountRole)
  role: AdminAccountRole;
}
