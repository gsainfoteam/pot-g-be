import { StopsEntity } from "@src/discovery/model/stops.entity";

export class RouteEntity {
  pk?: string;
  fromStopFk?: string;
  fromStop?: StopsEntity;
  toStopFk?: string;
  toStop?: StopsEntity;
  createdAt?: Date;
  updatedAt?: Date;
}
