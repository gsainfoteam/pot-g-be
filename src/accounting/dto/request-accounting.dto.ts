export class AccountInfo {
  use_exist_info: boolean;
  bank_pk?: string;
  account?: string;
  need_set?: boolean;
}

export class RequestAccountingRequestDto {
  total_cost: number;
  cost_per_user: number;
  account_info: AccountInfo;
  requested_user: string[];
}
