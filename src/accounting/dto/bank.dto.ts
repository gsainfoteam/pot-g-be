import { ApiProperty } from "@nestjs/swagger";
export class BankDto {
  @ApiProperty({ type: String })
  id: string;
  @ApiProperty({ type: Boolean })
  is_securities: boolean;
  @ApiProperty({ type: String })
  bank_full_name: string;
  @ApiProperty({ type: String })
  logo: string;
}
