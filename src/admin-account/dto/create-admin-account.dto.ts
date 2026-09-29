import { IsEmail, IsIn, IsOptional } from "class-validator";
import { AdminAccountRole } from "@src/database/entity/admin-account.entity";

export class CreateAdminAccountRequestDto {
  @IsEmail()
  email: string;

  @IsOptional()
  @IsIn(["admin", "superadmin"])
  role?: AdminAccountRole;
}
