import { PotRoomEntity } from "@src/database/entity/pot-room.entity";

export class PotRoomAdminEntity extends PotRoomEntity {
  departureTime?: Date | null; // 확정된 출발 시간 (조인 쿼리 필요)
}
