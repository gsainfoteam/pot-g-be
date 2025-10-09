export class AccountingResultDto {
  user_pk: string;
  accounting_done: boolean;
}

export class ConfirmAccountingRequestDto {
  accounting_results: AccountingResultDto[];
}
