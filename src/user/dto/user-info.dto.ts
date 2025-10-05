import { PushSettingDto } from "@src/user/dto/push-setting.dto";
import { AccountingDto } from "@src/user/dto/accounting.dto";

export class UserInfoDto {
  id: string;
  name: string;
  email: string;
  push_setting: PushSettingDto;
  accounting: AccountingDto;
}
