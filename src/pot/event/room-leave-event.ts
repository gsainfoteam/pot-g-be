import { Room } from "../model/room";
import { RoomArchiveEventV1 } from "./room-archive-event";
import type { RoomEvent } from "./room-event";
import { RoomReducer } from "./room-reducer";

export type RoomLeaveEventV1Dto = {
  userId: string; // 퇴장할 유저의 ID
  roomId: string; // 퇴장할 방의 ID
};

export class RoomLeaveEventV1 implements RoomEvent<RoomLeaveEventV1Dto> {
  private constructor(data: RoomLeaveEventV1Dto) {
    this.eventType = "RoomLeaveEventV1";
    this.data = data;
    this.timestamp = new Date();
    this.dispatcher = RoomLeaveEventV1.getDispatcherFunction();
  }

  static generateRoomLeaveEvent(data: RoomLeaveEventV1Dto) {
    return new RoomLeaveEventV1(data);
  }

  static getDispatcherFunction(): (
    room: Room,
    data: RoomLeaveEventV1Dto,
  ) => Room {
    return (room: Room, data: RoomLeaveEventV1Dto) => {
      // 방 존재 여부 확인
      if (room.roomId !== data.roomId || room.isArchived) {
        throw new Error("Room ID does not match or room is archived");
      }

      // 출발 시간이 정해지면 퇴장 불가
      if (room.departureTime !== null) {
        throw new Error("Departure time is already set");
      }

      if (!room.joinedUserIds.includes(data.userId)) {
        throw new Error("User is not in the room");
      }

      // 퇴장할 유저가 방에 존재하는 경우 퇴장
      room.joinedUserIds = room.joinedUserIds.filter(
        (userId) => userId !== data.userId,
      );

      // 방에 남은 유저가 없는 경우 방 삭제
      if (room.joinedUserIds.length === 0) {
        const roomArchiveEvent = RoomArchiveEventV1.generateRoomArchiveEvent({
          roomId: room.roomId,
        });
        room = new RoomReducer().reduce(room, roomArchiveEvent);
      }

      // 퇴장한 유저가 방장인 경우 방장 선출
      if (room.hostUserId === data.userId) {
        room.hostUserId = room.joinedUserIds[0];
      }

      return room;
    };
  }

  readonly eventType: string;
  readonly data: RoomLeaveEventV1Dto;
  readonly timestamp: Date;
  readonly dispatcher: (room: Room, data: RoomLeaveEventV1Dto) => Room;
}
