import { ApiProperty } from "@nestjs/swagger";
export class AccountingResultDto {
  @ApiProperty({ type: String })
  user_pk: string;
  @ApiProperty({ type: Boolean })
  accounting_done: boolean;
}

export class ConfirmAccountingRequestDto {
  @ApiProperty({ type: () => AccountingResultDto, isArray: true })
  accounting_results: AccountingResultDto[];
}
