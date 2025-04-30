import { Room } from "../model/room";
import type { RoomEvent } from "./room-event";

export type RoomArchiveEventV1Dto = {
  roomId: string;
};

export class RoomArchiveEventV1 implements RoomEvent<RoomArchiveEventV1Dto> {
  private constructor(data: RoomArchiveEventV1Dto) {
    this.eventType = "RoomArchiveEventV1";
    this.data = data;
    this.timestamp = new Date();
    this.dispatcher = RoomArchiveEventV1.getDispatcherFunction();
  }

  static generateRoomArchiveEvent(data: RoomArchiveEventV1Dto) {
    return new RoomArchiveEventV1(data);
  }

  private static getDispatcherFunction(): (
    room: Room,
    data: RoomArchiveEventV1Dto,
  ) => Room {
    return (room: Room, data: RoomArchiveEventV1Dto) => {
      // 방 존재 여부 확인 및 이미 삭제된 방인 경우 예외 발생
      if (room.roomId !== data.roomId || room.isArchived) {
        throw new Error("Room ID does not match or room is archived");
      }

      room.isArchived = true;

      return room;
    };
  }

  readonly eventType: string;
  readonly data: RoomArchiveEventV1Dto;
  readonly timestamp: Date;
  readonly dispatcher: (room: Room, data: RoomArchiveEventV1Dto) => Room;
}
