import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
export class AccountingDto {
  @ApiProperty({ type: Boolean })
  is_set: boolean;
  @ApiPropertyOptional({ type: String })
  bank_short_name?: string;
  @ApiPropertyOptional({ type: String })
  account?: string;
}
