import { DeviceEntity } from "@src/user/model/device.entity";

export class UserAlarmSettingEntity {
  pk?: string;
  deviceFk?: string;
  device?: DeviceEntity;
  anyPush?: boolean;
  chatPush?: boolean;
  marketingPush?: boolean;
  potInOutPush?: boolean;
}
