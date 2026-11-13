import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
export class AccountInfo {
  @ApiProperty({ type: Boolean })
  use_exist_info: boolean;
  @ApiPropertyOptional({ type: String })
  bank_pk?: string;
  @ApiPropertyOptional({ type: String })
  account?: string;
  @ApiPropertyOptional({ type: Boolean })
  need_set?: boolean;
}

export class RequestAccountingRequestDto {
  @ApiProperty({ type: Number })
  total_cost: number;
  @ApiProperty({ type: Number })
  cost_per_user: number;
  @ApiProperty({ type: () => AccountInfo })
  account_info: AccountInfo;
  @ApiProperty({ type: String, isArray: true })
  requested_user: string[];
}
