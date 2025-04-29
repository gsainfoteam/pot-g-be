import type { Room } from "../model/room";

export interface RoomRepository {
  save(room: Room): Promise<Room>;
  findById(roomId: string): Promise<Room | null>;
} 