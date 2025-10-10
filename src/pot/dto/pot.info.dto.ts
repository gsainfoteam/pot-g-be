import { RouteDto } from "@src/discovery/dto/route.dto";
import { AccountingResultDto } from "@src/accounting/dto/confirm-accounting.dto";

export class PotUserDto {
  id: string;
  name: string;
  is_host: boolean;
  is_in_pot: boolean;
}

export class PotUsersInfoDto {
  current: number;
  total: number;
  users: PotUserDto[];
}

export class PotAccountingInfoDto {
  requesting_user?: string;
  accountingResults: AccountingResultDto[];
  total_cost?: number;
  cost_per_user?: number;
  bank_name?: string;
  bank_account?: string;
}

export class PotInfoDto {
  id: string;
  name: string;
  route: RouteDto;
  starts_at: Date;
  ends_at: Date;
  departure_time?: Date;
  status: string;
  users_info: PotUsersInfoDto;
  accounting_info: PotAccountingInfoDto;
}
