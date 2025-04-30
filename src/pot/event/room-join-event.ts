import { Room } from "../model/room";
import type { RoomEvent } from "./room-event";

export type RoomJoinEventV1Dto = {
  userId: string;
  roomId: string;
};

export class RoomJoinEventV1 implements RoomEvent<RoomJoinEventV1Dto> {
  private constructor(data: RoomJoinEventV1Dto) {
    this.eventType = "RoomJoinEventV1";
    this.data = data;
    this.timestamp = new Date();
    this.dispatcher = RoomJoinEventV1.getDispatcherFunction();
  }

  static generateRoomJoinEvent(data: RoomJoinEventV1Dto) {
    return new RoomJoinEventV1(data);
  }

  static getDispatcherFunction(): (
    room: Room,
    data: RoomJoinEventV1Dto,
  ) => Room {
    return (room: Room, data: RoomJoinEventV1Dto) => {
      // 방 존재 여부 확인
      if (room.roomId !== data.roomId) {
        throw new Error("Room ID does not match");
      }

      // 이미 참여한 유저인 경우 참여 불가
      if (room.joinedUserIds.includes(data.userId)) {
        throw new Error("User already joined the room");
      }

      // 방 인원 초과인 경우 참여 불가
      if (room.joinedUserIds.length >= room.maxCapacity) {
        throw new Error("Room is full");
      }

      room.joinedUserIds.push(data.userId);
      return room;
    };
  }

  readonly eventType: string;
  readonly data: RoomJoinEventV1Dto;
  readonly timestamp: Date;
  readonly dispatcher: (room: Room, data: RoomJoinEventV1Dto) => Room;
}
