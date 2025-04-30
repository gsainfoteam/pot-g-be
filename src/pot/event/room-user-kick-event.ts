import { Room } from "../model/room";
import type { RoomEvent } from "./room-event";

export type RoomUserKickEventV1Dto = {
  userId: string;
  roomId: string;
  kickedUserId: string;
};

export class RoomUserKickEventV1 implements RoomEvent<RoomUserKickEventV1Dto> {
  private constructor(data: RoomUserKickEventV1Dto) {
    this.eventType = "RoomUserKickEventV1";
    this.data = data;
    this.timestamp = new Date();
    this.dispatcher = RoomUserKickEventV1.getDispatcherFunction();
  }

  static generateRoomUserKickEvent(data: RoomUserKickEventV1Dto) {
    return new RoomUserKickEventV1(data);
  }

  static getDispatcherFunction(): (
    room: Room,
    data: RoomUserKickEventV1Dto,
  ) => Room {
    return (room: Room, data: RoomUserKickEventV1Dto) => {
      // 방 존재 여부 확인
      if (room.roomId !== data.roomId || room.isArchived) {
        throw new Error("Room ID does not match or room is archived");
      }

      // 출발 시간이 정해지면 강퇴 불가
      if (room.departureTime !== null) {
        throw new Error("Departure time is already set");
      }

      // 방장만 강퇴 가능
      if (room.hostUserId !== data.userId) {
        throw new Error("User is not the host");
      }

      // 방장을 강퇴할 수 없음
      if (data.kickedUserId === room.hostUserId) {
        throw new Error("Host cannot be kicked");
      }

      // 강퇴할 유저가 방에 존재하는지 확인
      if (!room.joinedUserIds.includes(data.kickedUserId)) {
        throw new Error("User is not in the room");
      }

      room.joinedUserIds = room.joinedUserIds.filter(
        (userId) => userId !== data.kickedUserId,
      );

      return room;
    };
  }

  readonly eventType: string;
  readonly data: RoomUserKickEventV1Dto;
  readonly timestamp: Date;
  readonly dispatcher: (room: Room, data: RoomUserKickEventV1Dto) => Room;
}
