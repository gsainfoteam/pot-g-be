import { PopoChatStringType } from "../../../drizzle/schema/popo-chat-msg";
import { PotRoomEntity } from "@src/database/entity/pot-room.entity";
import { PopoChatMsgEntity } from "@src/database/entity/popo-chat-msg.entity";

export class PopoChatReservationEntity {
  pk?: string;
  potFk: string;
  pot?: PotRoomEntity;
  popoChatMsgType: PopoChatStringType;
  popoChatMsgEntity?: PopoChatMsgEntity;
  sendAfter: Date;
  createdAt: Date;
  updatedAt: Date;
  formatArguments?: any;
}
