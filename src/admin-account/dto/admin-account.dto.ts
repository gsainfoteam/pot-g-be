import { ApiProperty } from "@nestjs/swagger";
import { AdminAccountRole } from "@src/admin-database/entity/admin-account.entity";

export class AdminAccountDto {
  @ApiProperty({ type: String })
  pk: string;
  @ApiProperty({ type: String })
  email: string;
  @ApiProperty({ enum: AdminAccountRole, enumName: "AdminAccountRole" })
  role: AdminAccountRole;
  @ApiProperty({ type: Date })
  created_at: Date;
  @ApiProperty({ type: Date })
  updated_at: Date;
}
