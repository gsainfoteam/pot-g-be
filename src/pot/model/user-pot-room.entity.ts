import { UserEntity } from "@src/user/model/user.entity";
import { PotRoomEntity } from "@src/discovery/model/pot-room.entity";

export class UserPotRoomEntity {
  potRoomFk: string;
  potRoomEntity?: PotRoomEntity;
  userFk: string;
  userEntity?: UserEntity;
  isHost: boolean;
  isArchived: boolean;
}
