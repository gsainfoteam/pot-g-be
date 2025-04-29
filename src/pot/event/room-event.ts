import type { Room } from "@src/pot/model/room";

export interface RoomEvent<T> {
  //Metadata of event
  eventType: string;

  //RealData of Event
  data: T;
  timestamp: Date;
  dispatcher: (room: Room, data: T) => Room;
}
