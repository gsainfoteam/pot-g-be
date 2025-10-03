import { UserEntity } from "@src/database/entity/user.entity";
import { PotRoomEntity } from "@src/database/entity/pot-room.entity";

export class UserPotRoomEntity {
  potRoomFk: string;
  potRoomEntity?: PotRoomEntity;
  userFk: string;
  userEntity?: UserEntity;
  isHost: boolean;
  isArchived: boolean;
}
