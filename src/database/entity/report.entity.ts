import { UserEntity } from "@src/database/entity/user.entity";
import { PotRoomEntity } from "@src/database/entity/pot-room.entity";

export class ReportEntity {
  pk?: string;
  potRoomFk: string;
  potRoomEntity?: PotRoomEntity;
  userFk: string;
  userEntity?: UserEntity;
  targetUserFk: string;
  targetUserEntity?: UserEntity;
  reason: string;
  createdAt?: Date;
  updatedAt?: Date;
}
