import { RouteDto } from "@src/discovery/dto/route.dto";

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
  requested: boolean;
  requesting_user?: string;
  requested_users: string[];
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
