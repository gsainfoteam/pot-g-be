import { FofoChatStringType } from "@drizzle-schema/fofo-chat-msg";
import { PotRoomEntity } from "@src/database/entity/pot-room.entity";
import { FofoChatMsgEntity } from "@src/database/entity/fofo-chat-msg.entity";

export class FofoChatReservationEntity {
  pk?: string;
  potFk: string;
  pot?: PotRoomEntity;
  fofoChatMsgType: FofoChatStringType;
  fofoChatMsgEntity?: FofoChatMsgEntity;
  sendAfter: Date;
  createdAt: Date;
  updatedAt: Date;
  formatArguments?: any;
}
