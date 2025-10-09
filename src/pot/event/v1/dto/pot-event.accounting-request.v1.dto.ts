export class PotEventAccountingRequestV1Dto {
  request_user_pk: string;
  requested_users_pk: string[];
  total_cost: number;
  cost_per_user: number;
  bank_pk: string;
  bank_name: string;
  bank_account: string;
}
