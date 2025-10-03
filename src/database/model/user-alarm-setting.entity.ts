import { DeviceEntity } from "@src/database/model/device.entity";

export class UserAlarmSettingEntity {
  pk?: string;
  deviceFk?: string;
  device?: DeviceEntity;
  anyPush?: boolean;
  chatPush?: boolean;
  marketingPush?: boolean;
  potInOutPush?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
