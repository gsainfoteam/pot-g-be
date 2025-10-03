import { Injectable } from "@nestjs/common";
import { DatabaseService } from "@src/database/database.service";
import { TxType } from "@src/global/types/tx.types";
import { UserPotRoomEntity } from "@src/database/entity/user-pot-room.entity";
import { userPotRoom } from "../../../drizzle/schema/user-pot-room";
import { and, eq } from "drizzle-orm";

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
        isArchived: userPotRoomEntity.isArchived,
      })
      .returning();

    if (result.length === 0) {
      throw new Error("Failed to insert user pot room"); // TODO
    }

    return this.resultToUserPotRoomEntity(result[0]);
  }

  /*
  DELETE FROM user_pot_room
    WHERE pot_room_fk = ?1
    AND user_fk = ?2;
   */
  async deleteByPotRoomFkAndUserFk(
    potRoomFk: string,
    userFk: string,
    tx: TxType,
  ): Promise<void> {
    await tx
      .delete(userPotRoom)
      .where(
        and(
          eq(userPotRoom.potRoomFk, potRoomFk),
          eq(userPotRoom.userFk, userFk),
        ),
      );
  }

  private resultToUserPotRoomEntity(result: any): UserPotRoomEntity {
    return {
      potRoomFk: result.potRoomFk,
      userFk: result.userFk,
      isHost: result.isHost,
      isArchived: result.isArchived,
    };
  }
}
