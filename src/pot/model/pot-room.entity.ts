import { RouteEntity } from "@src/discovery/model/route.entity";

export class PotRoomEntity {
  pk: string;
  routeFk: string;
  routeEntity?: RouteEntity;
  isArchived: boolean;
  isDeleted: boolean;
  isDepartureConfirmed: boolean;
  maxCapacity: number;
  startsAt: Date;
  endsAt: Date;
  createdAt: Date;
  updatedAt: Date;
  name: string;
}
