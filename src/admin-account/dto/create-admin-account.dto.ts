import { IsEmail, IsEnum, IsOptional } from "class-validator";
import { AdminAccountRole } from "@src/admin-database/entity/admin-account.entity";
import { Transform } from "class-transformer";

export class CreateAdminAccountRequestDto {
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @IsEmail()
  email: string;

  @IsOptional()
  @IsEnum(AdminAccountRole)
  role?: AdminAccountRole;
}
