import { ApiProperty } from "@nestjs/swagger";
export class PotEventAccountingRequestV1Dto {
  @ApiProperty({ type: String })
  request_user_pk: string;
  @ApiProperty({ type: String, isArray: true })
  requested_users_pk: string[];
  @ApiProperty({ type: Number })
  total_cost: number;
  @ApiProperty({ type: Number })
  cost_per_user: number;
  @ApiProperty({ type: String })
  bank_pk: string;
  @ApiProperty({ type: String })
  bank_name: string;
  @ApiProperty({ type: String })
  bank_account: string;
}
