import { Injectable } from "@nestjs/common";
import type { Room } from "../model/room";
import type { RoomEvent } from "./room-event";
import type { RoomRepository } from "../repository/room-repository";

@Injectable()
export class RoomReducer {
  constructor(private readonly roomRepository: RoomRepository) {}

  async reduce<T>(room: Room, event: RoomEvent<T>): Promise<Room> {
    const updatedRoom = event.dispatcher(room, event.data);
    return this.roomRepository.save(updatedRoom);
  }
}
