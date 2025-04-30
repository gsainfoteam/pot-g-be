import { Room } from "../model/room";
import type { RoomEvent } from "./room-event";

export type RoomSendPaymentConfirmEventV1Dto = {
  userId: string; // 송금 받을 유저의 ID
  roomId: string; // 송금 받을 방의 ID
  sendedUserId: string; // 송금 보낸 유저의 ID
};

// 송금 확인 이벤트
export class RoomSendPaymentConfirmEventV1
  implements RoomEvent<RoomSendPaymentConfirmEventV1Dto>
{
  private constructor(data: RoomSendPaymentConfirmEventV1Dto) {
    this.eventType = "RoomSendPaymentConfirmEventV1";
    this.data = data;
    this.timestamp = new Date();
    this.dispatcher = RoomSendPaymentConfirmEventV1.getDispatcherFunction();
  }

  static generateRoomSendPaymentConfirmEvent(
    data: RoomSendPaymentConfirmEventV1Dto,
  ) {
    return new RoomSendPaymentConfirmEventV1(data);
  }

  private static getDispatcherFunction(): (
    room: Room,
    data: RoomSendPaymentConfirmEventV1Dto,
  ) => Room {
    return (room: Room, data: RoomSendPaymentConfirmEventV1Dto) => {
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

      // 해당 유저가 송금 받을 유저인지 확인
      if (room.recipientUserId !== data.userId) {
        throw new Error("User is not the recipient");
      }

      // 송금 보낼 유저 제거
      room.senderUserIds = room.senderUserIds.filter(
        (userId) => userId !== data.sendedUserId,
      );

      // 송금 보낸 유저 추가
      room.sendedUserIds.push(data.sendedUserId);

      return room;
    };
  }

  readonly eventType: string;
  readonly data: RoomSendPaymentConfirmEventV1Dto;
  readonly timestamp: Date;
  readonly dispatcher: (
    room: Room,
    data: RoomSendPaymentConfirmEventV1Dto,
  ) => Room;
}
