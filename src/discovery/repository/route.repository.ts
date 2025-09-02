import { Injectable } from "@nestjs/common";
import { DatabaseService } from "@src/database/database.service";
import { stops } from "../../../drizzle/schema/stops";
import { RouteEntity } from "@src/discovery/model/route.entity";
import { route } from "../../../drizzle/schema/route";
import { eq } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

const fromStop = alias(stops, "fs");
const toStop = alias(stops, "ts");

@Injectable()
export class RouteRepository {
  constructor(private readonly dbService: DatabaseService) {}

  /*
  SELECT r.pk,
         fs.pk, fs.name_kor, fs.name_eng,
         ts.pk, ts.name_kor, ts.name_eng
  FROM route as r
  INNER JOIN stops as fs ON r.from_stop_fk = fs.pk
  INNER JOIN stops as ts ON r.to_stop_fk = ts.pk;
   */
  async findAllWithStops(): Promise<RouteEntity[]> {
    const results = await this.dbService.db
      .select({
        routePk: route.pk,
        fromStopFk: fromStop.pk,
        fromStopNameKor: fromStop.nameKor,
        fromStopNameEng: fromStop.nameEng,
        toStopFk: toStop.pk,
        toStopNameKor: toStop.nameKor,
        toStopNameEng: toStop.nameEng,
      })
      .from(route)
      .innerJoin(fromStop, eq(route.fromStopFk, fromStop.pk))
      .innerJoin(toStop, eq(route.toStopFk, toStop.pk));

    return results.map((result) => this.resultToRouteEntity(result));
  }

  private resultToRouteEntity(result: any): RouteEntity {
    return {
      pk: result.routePk,
      fromStopFk: result.fromStopFk,
      fromStop: {
        pk: result.fromStopFk,
        nameKor: result.fromStopNameKor,
        nameEng: result.fromStopNameEng,
      },
      toStopFk: result.toStopFk,
      toStop: {
        pk: result.toStopFk,
        nameKor: result.toStopNameKor,
        nameEng: result.toStopNameEng,
      },
    };
  }
}
