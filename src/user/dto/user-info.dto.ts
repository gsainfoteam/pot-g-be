import { ApiProperty } from "@nestjs/swagger";
import { PushSettingDto } from "@src/user/dto/push-setting.dto";
import { AccountingDto } from "@src/user/dto/accounting.dto";

export class UserInfoDto {
  @ApiProperty({ type: String })
  id: string;
  @ApiProperty({ type: String })
  name: string;
  @ApiProperty({ type: String })
  email: string;
  @ApiProperty({ type: () => PushSettingDto })
  push_setting: PushSettingDto;
  @ApiProperty({ type: () => AccountingDto })
  accounting: AccountingDto;
  @ApiProperty({ type: String, isArray: true })
  terms: string[];
}
