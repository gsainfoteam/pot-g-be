import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEmail, IsEnum, IsOptional } from "class-validator";
import { AdminAccountRole } from "@src/admin-database/entity/admin-account.entity";
import { Transform } from "class-transformer";

export class CreateAdminAccountRequestDto {
  @ApiProperty({ type: String, format: "email" })
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ enum: AdminAccountRole, enumName: "AdminAccountRole" })
  @IsOptional()
  @IsEnum(AdminAccountRole)
  role?: AdminAccountRole;
}
