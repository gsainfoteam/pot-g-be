import { Injectable } from "@nestjs/common";
import { DatabaseService } from "@src/database/database.service";
import { bank } from "../../../drizzle/schema/bank";
import { TxType } from "@src/global/types/tx.types";
import { UserPotRoomEntity } from "@src/pot/model/user-pot-room.entity";
import { userPotRoom } from "../../../drizzle/schema/user-pot-room";

@Injectable()
export class UserPotRoomRepository {
  constructor(private readonly dbService: DatabaseService) {}

  async insert(
    userPotRoomEntity: UserPotRoomEntity,
    tx: TxType,
  ): Promise<UserPotRoomEntity | null> {
    const result = await tx
      .insert(userPotRoom)
      .values({
        potRoomFk: userPotRoomEntity.potRoomFk,
        userFk: userPotRoomEntity.userFk,
        isHost: userPotRoomEntity.isHost,
      })
      .returning();

    if (result.length === 0) {
      throw new Error("Failed to insert user pot room"); // TODO
    }

    return this.resultToUserPotRoomEntity(result[0]);
  }

  private resultToUserPotRoomEntity(result: any): UserPotRoomEntity {
    return {
      potRoomFk: result.potRoomFk,
      userFk: result.userFk,
      isHost: result.isHost,
    };
  }
}
