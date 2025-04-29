import type { Room } from "../model/room";
import type { TaxiRoute } from "../model/room";
import type { RoomEvent } from "./room-event";

export type RoomCreateEventV1Dto = {
  name: string;
  createUserId: string;
  route: TaxiRoute;
  maxCapacity: number;
  departureStartTime: Date;
  departureEndTime: Date;
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

  static getDispatcherFunction(): (
    room: Room,
    data: RoomCreateEventV1Dto,
  ) => Room {
    return (room: Room, data: RoomCreateEventV1Dto) => {
      const now = new Date();

      room.roomId = Room.generateRoomId();
      const randomNumber = room.roomId.slice(-4);

      room.hostUserId = data.createUserId;
      room.joinedUserIds.push(data.createUserId);
      room.name = Room.generateRoomName(data.route, randomNumber);
      room.route = data.route;

      room.maxCapacity = data.maxCapacity;
      room.departureStartTime = data.departureStartTime;
      room.departureEndTime = data.departureEndTime;

      room.createAt = now;
      room.updateAt = now;
      return room;
    };
  }

  readonly eventType: string;
  readonly data: RoomCreateEventV1Dto;
  readonly timestamp: Date;
  readonly dispatcher: (room: Room, data: RoomCreateEventV1Dto) => Room;
}
