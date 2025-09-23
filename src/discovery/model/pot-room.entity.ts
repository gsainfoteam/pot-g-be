import { RouteEntity } from "@src/discovery/model/route.entity";

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
  createdAt: Date;
  updatedAt: Date;
  name: string;
}
