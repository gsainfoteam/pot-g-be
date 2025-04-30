import { Room } from "../model/room";
import type { RoomEvent } from "./room-event";

export type RoomDepartureConfirmEventV1Dto = {
  roomId: string;
  userId: string;
  departureTime: Date;
};

export class RoomDepartureConfirmEventV1
  implements RoomEvent<RoomDepartureConfirmEventV1Dto>
{
  private constructor(data: RoomDepartureConfirmEventV1Dto) {
    this.eventType = "RoomDepartureConfirmEventV1";
    this.data = data;
    this.timestamp = new Date();
    this.dispatcher = RoomDepartureConfirmEventV1.getDispatcherFunction();
  }

  static generateRoomDepartureConfirmEvent(
    data: RoomDepartureConfirmEventV1Dto,
  ) {
    return new RoomDepartureConfirmEventV1(data);
  }

  static getDispatcherFunction(): (
    room: Room,
    data: RoomDepartureConfirmEventV1Dto,
  ) => Room {
    return (room: Room, data: RoomDepartureConfirmEventV1Dto) => {
      // 방 존재 여부 확인
      if (room.roomId !== data.roomId || room.isArchived) {
        throw new Error("Room ID does not match or room is archived");
      }

      // 방장만 출발 확정을 정할 수 있음
      if (room.hostUserId !== data.userId) {
        throw new Error("User is not the host");
      }

      // 출발 시간이 정해지지 않은 경우에만 출발 확정 가능
      if (room.departureTime !== null) {
        throw new Error("Departure time already set");
      }

      // 출발 시간이 현재 시간 이후여야 함
      if (data.departureTime < new Date()) {
        throw new Error("Departure time must be in the future");
      }

      // 출발 시간이 출발 가능 시작 시간과 출발 가능 종료 시간 사이여야 함
      if (
        data.departureTime < room.departureAvailableStartTime ||
        data.departureTime > room.departureAvailableEndTime
      ) {
        throw new Error(
          "Departure time must be between departure available start time and end time",
        );
      }

      room.departureTime = data.departureTime;
      return room;
    };
  }

  readonly eventType: string;
  readonly data: RoomDepartureConfirmEventV1Dto;
  readonly timestamp: Date;
  readonly dispatcher: (
    room: Room,
    data: RoomDepartureConfirmEventV1Dto,
  ) => Room;
}
