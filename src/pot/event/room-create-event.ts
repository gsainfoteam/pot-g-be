import { Room } from "../model/room";
import type { TaxiRoute } from "../model/room";
import type { RoomEvent } from "./room-event";

//Fixme : Id들이 그대로 복원이 안됨 아예 인풋으로 받아야함
export type RoomCreateEventV1Dto = {
  roomId: string;
  name: string;
  createUserId: string;
  route: TaxiRoute;
  maxCapacity: number;
  departureAvailableStartTime: Date;
  departureAvailableEndTime: Date;
};

export class RoomCreateEventV1 implements RoomEvent<RoomCreateEventV1Dto> {
  private constructor(data: RoomCreateEventV1Dto) {
    this.eventType = "RoomCreateEventV1";
    this.data = data;
    this.timestamp = new Date();
    this.dispatcher = RoomCreateEventV1.getDispatcherFunction();
  }

  static generateRoomCreateEvent(data: RoomCreateEventV1Dto) {
    return new RoomCreateEventV1(data);
  }

  private static getDispatcherFunction(): (
    room: Room,
    data: RoomCreateEventV1Dto,
  ) => Room {
    return (room: Room, data: RoomCreateEventV1Dto) => {
      const now = new Date();

      // 출발 가능 시간의 범위는 현재 시간 이후여야 한다.
      if (
        data.departureAvailableStartTime < now ||
        data.departureAvailableEndTime < now
      ) {
        throw new Error(
          "Departure start time or end time must be in the future",
        );
      }

      // 출발 가능 시작 시간은 출발 가능 종료 시간 이전이어야 한다.
      if (data.departureAvailableStartTime > data.departureAvailableEndTime) {
        throw new Error("Departure start time must be before end time");
      }

      // 출발 가능 시작 시간과 출발 종료시간은 24시간 이상 차이날 수 없다
      if (
        data.departureAvailableEndTime.getTime() -
          data.departureAvailableStartTime.getTime() >
        24 * 60 * 60 * 1000
      ) {
        throw new Error(
          "Departure start time and end time must be within 24 hours",
        );
      }

      // 최대 인원 수는 1명 이상 4명 이하여야 한다.
      if (data.maxCapacity <= 0 || data.maxCapacity > 4) {
        throw new Error("Max capacity must be between 1 and 5");
      }

      // 출발 가능 종료 시간은 현재 시간 이후 30일 이내여야 한다.
      if (
        data.departureAvailableEndTime >
        new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
      ) {
        throw new Error("Departure end time must be within one month");
      }

      room.roomId = data.roomId;
      const randomNumber = room.roomId.slice(-4);

      room.hostUserId = data.createUserId;
      room.joinedUserIds.push(data.createUserId);
      room.name = Room.generateRoomName(data.route, randomNumber);
      room.route = data.route;

      room.maxCapacity = data.maxCapacity;
      room.departureAvailableStartTime = data.departureAvailableStartTime;
      room.departureAvailableEndTime = data.departureAvailableEndTime;

      room.createAt = now;
      room.updateAt = now;

      room.departureTime = null;
      room.isArchived = false;

      return room;
    };
  }

  readonly eventType: string;
  readonly data: RoomCreateEventV1Dto;
  readonly timestamp: Date;
  readonly dispatcher: (room: Room, data: RoomCreateEventV1Dto) => Room;
}
