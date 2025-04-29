import { Room } from "../model/room";
import type { RoomEvent } from "./room-event";

export class RoomReducer {
  reduce<T>(room: Room, event: RoomEvent<T>): Room {
    const updatedRoom = event.dispatcher(room, event.data);
    return updatedRoom;
  }

  reduceAll(room: Room, events: RoomEvent<any>[]): Room {
    return events.reduce((currentRoom, event) => {
      return event.dispatcher(currentRoom, event.data);
    }, room);
  }

  reduceFromInitialState(events: RoomEvent<any>[]): Room {
    return this.reduceAll(new Room(), events);
  }
}
