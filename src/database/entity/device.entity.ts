import { UserEntity } from "@src/database/entity/user.entity";

export class DeviceEntity {
  pk?: string;
  userFk?: string;
  user?: UserEntity;
  deviceId: string;
  fcmToken?: string;
  os: string;
  version: string;
  createdAt?: Date;
  updatedAt?: Date;
  loggedIn: boolean;
}
