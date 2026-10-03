import { RouteEntity } from "@src/database/entity/route.entity";
import { Pot } from "@src/pot/model/pot";

export class PotRoomEntity {
  pk: string;
  routeFk: string;
  routeEntity?: RouteEntity;
  isArchived: boolean;
  isDeleted: boolean;
  isDepartureConfirmed: boolean;
  currentUserCount?: number; // 현재 참여 인원 (조인 쿼리 필요)
  maxCapacity: number;
  startsAt: Date;
  endsAt: Date;
  departureTime?: Date | null; // 확정된 출발 시간 (조인 쿼리 필요)
  createdAt: Date;
  updatedAt: Date;
  name: string;
  pot?: Pot; // 팟 이벤트의 reduce 결과 (조인 쿼리 필요)
}
