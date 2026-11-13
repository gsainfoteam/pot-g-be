import { ApiProperty } from "@nestjs/swagger";
export class ChangeAccountingRequestDto {
  @ApiProperty({ type: String })
  bank_pk: string;
  @ApiProperty({ type: String })
  account: string;
}
