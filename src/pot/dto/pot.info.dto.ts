import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { RouteDto } from "@src/discovery/dto/route.dto";
import { AccountingResultDto } from "@src/accounting/dto/confirm-accounting.dto";

export class PotUserDto {
  @ApiProperty({ type: String })
  id: string;
  @ApiProperty({ type: String })
  name: string;
  @ApiProperty({ type: Boolean })
  is_host: boolean;
  @ApiProperty({ type: Boolean })
  is_in_pot: boolean;
}

export class PotUsersInfoDto {
  @ApiProperty({ type: Number })
  current: number;
  @ApiProperty({ type: Number })
  total: number;
  @ApiProperty({ type: () => PotUserDto, isArray: true })
  users: PotUserDto[];
}

export class PotAccountingInfoDto {
  @ApiPropertyOptional({ type: String })
  requesting_user?: string;
  @ApiProperty({ type: () => AccountingResultDto, isArray: true })
  accounting_results: AccountingResultDto[];
  @ApiPropertyOptional({ type: Number })
  total_cost?: number;
  @ApiPropertyOptional({ type: Number })
  cost_per_user?: number;
  @ApiPropertyOptional({ type: String })
  bank_name?: string;
  @ApiPropertyOptional({ type: String })
  bank_account?: string;
}

export class PotInfoDto {
  @ApiProperty({ type: String })
  id: string;
  @ApiProperty({ type: String })
  name: string;
  @ApiProperty({ type: () => RouteDto })
  route: RouteDto;
  @ApiProperty({ type: String })
  starts_at: string;
  @ApiProperty({ type: String })
  ends_at: string;
  @ApiPropertyOptional({ type: String })
  departure_time?: string;
  @ApiProperty({ type: String })
  status: string;
  @ApiProperty({ type: () => PotUsersInfoDto })
  users_info: PotUsersInfoDto;
  @ApiProperty({ type: () => PotAccountingInfoDto })
  accounting_info: PotAccountingInfoDto;
}
