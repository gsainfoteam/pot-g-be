import { UserEntity } from "@src/database/entity/user.entity";

export class DeviceEntity {
  pk?: string;
  userFk?: string;
  user?: UserEntity;
  fcmToken?: string;
  os: string;
  version: string;
  createdAt?: Date;
  updatedAt?: Date;
}
