import { Room } from "../model/room";
import type { RoomEvent } from "./room-event";

export type RoomSetRecipientEventV1Dto = {
  userId: string; // 송금 받을 유저의 ID
  roomId: string; // 송금 받을 방의 ID
  amount: number; // 송금 금액 (원)
  senderUserId: string[]; // 송금 보낼 유저의 ID 리스트
};

export class RoomSetRecipientEventV1
  implements RoomEvent<RoomSetRecipientEventV1Dto>
{
  private constructor(data: RoomSetRecipientEventV1Dto) {
    this.eventType = "RoomSetRecipientEventV1";
    this.data = data;
    this.timestamp = new Date();
    this.dispatcher = RoomSetRecipientEventV1.getDispatcherFunction();
  }

  static generateRoomSetRecipientEvent(data: RoomSetRecipientEventV1Dto) {
    return new RoomSetRecipientEventV1(data);
  }

  private static getDispatcherFunction(): (
    room: Room,
    data: RoomSetRecipientEventV1Dto,
  ) => Room {
    return (room: Room, data: RoomSetRecipientEventV1Dto) => {
      // 방 존재 여부 확인
      if (room.roomId !== data.roomId || room.isArchived) {
        throw new Error("Room ID does not match or room is archived");
      }

      // 송금 받을 유저가 방에 존재하는지 확인
      if (!room.joinedUserIds.includes(data.userId)) {
        throw new Error("User is not in the room");
      }

      // 출발 시간이 정해지지 않았거나 출발 시간+30분이 아직 지나지 않은 경우 예외 발생
      if (
        room.departureTime === null ||
        new Date(room.departureTime.getTime() + 30 * 60 * 1000) > new Date()
      ) {
        throw new Error(
          "Cannot set recipient before departure time + 30 minutes has passed",
        );
      }

      // 송금 보낼 유저가 전부 방에 존재하는지 확인
      if (
        !data.senderUserId.every((userId) =>
          room.joinedUserIds.includes(userId),
        )
      ) {
        throw new Error("Sender user is not in the room");
      }

      // 송금 받을 유저와 송금 금액 설정
      room.recipientUserId = data.userId;
      room.recipientAmount = data.amount;
      room.senderUserIds = data.senderUserId;

      return room;
    };
  }

  readonly eventType: string;
  readonly data: RoomSetRecipientEventV1Dto;
  readonly timestamp: Date;
  readonly dispatcher: (room: Room, data: RoomSetRecipientEventV1Dto) => Room;
}
