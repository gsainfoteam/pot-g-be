import { Injectable } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { DatabaseService } from "@src/database/database.service";
import { stops } from "../../../drizzle/schema/stops";
import { RouteEntity } from "@src/database/entity/route.entity";
import { route } from "../../../drizzle/schema/route";
import { eq } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { PotgDBError } from "@src/global/exceptions/potg-db.error";
import { TxType } from "@src/global/types/tx.types";

const fromStop = alias(stops, "fs");
const toStop = alias(stops, "ts");

@Injectable()
export class RouteRepository {
  constructor(private readonly dbService: DatabaseService) {}

  /*
  SELECT r.pk, r.short_name_kor, r.short_name_eng,
         fs.pk, fs.name_kor, fs.name_eng, fs.lat, fs.lng,
         ts.pk, ts.name_kor, ts.name_eng, ts.lat, ts.lng
  FROM route as r
  INNER JOIN stops as fs ON r.from_stop_fk = fs.pk
  INNER JOIN stops as ts ON r.to_stop_fk = ts.pk;
   */
  async findAllWithStops(): Promise<RouteEntity[]> {
    const results = await this.dbService.db
      .select({
        routePk: route.pk,
        shortNameKor: route.shortNameKor,
        shortNameEng: route.shortNameEng,
        fromStopFk: fromStop.pk,
        fromStopNameKor: fromStop.nameKor,
        fromStopNameEng: fromStop.nameEng,
        fromStopLat: fromStop.lat,
        fromStopLng: fromStop.lng,
        toStopFk: toStop.pk,
        toStopNameKor: toStop.nameKor,
        toStopNameEng: toStop.nameEng,
        toStopLat: toStop.lat,
        toStopLng: toStop.lng,
      })
      .from(route)
      .innerJoin(fromStop, eq(route.fromStopFk, fromStop.pk))
      .innerJoin(toStop, eq(route.toStopFk, toStop.pk));

    return results.map((result) => this.resultToRouteEntity(result));
  }

  /*
  SELECT r.pk, r.short_name_kor, r.short_name_eng,
         fs.pk, fs.name_kor, fs.name_eng, fs.lat, fs.lng,
         ts.pk, ts.name_kor, ts.name_eng, ts.lat, ts.lng
  FROM route as r
  INNER JOIN stops as fs ON r.from_stop_fk = fs.pk
  INNER JOIN stops as ts ON r.to_stop_fk = ts.pk
  WHERE r.pk = ?1;
   */
  async findByPk(pk: string): Promise<RouteEntity | null> {
    const results = await this.dbService.db
      .select({
        routePk: route.pk,
        shortNameKor: route.shortNameKor,
        shortNameEng: route.shortNameEng,
        fromStopFk: fromStop.pk,
        fromStopNameKor: fromStop.nameKor,
        fromStopNameEng: fromStop.nameEng,
        fromStopLat: fromStop.lat,
        fromStopLng: fromStop.lng,
        toStopFk: toStop.pk,
        toStopNameKor: toStop.nameKor,
        toStopNameEng: toStop.nameEng,
        toStopLat: toStop.lat,
        toStopLng: toStop.lng,
      })
      .from(route)
      .innerJoin(fromStop, eq(route.fromStopFk, fromStop.pk))
      .innerJoin(toStop, eq(route.toStopFk, toStop.pk))
      .where(eq(route.pk, pk));

    if (results.length === 0) {
      return null;
    }

    return this.resultToRouteEntity(results[0]);
  }

  async insert(routeEntity: RouteEntity, tx: TxType): Promise<RouteEntity> {
    const result = await tx
      .insert(route)
      .values({
        pk: routeEntity.pk || randomUUID(),
        fromStopFk: routeEntity.fromStopFk,
        toStopFk: routeEntity.toStopFk,
        shortNameKor: routeEntity.shortNameKor,
        shortNameEng: routeEntity.shortNameEng,
      })
      .returning();

    if (result.length === 0) {
      throw new PotgDBError("Failed to insert route");
    }

    return {
      pk: result[0].pk,
      fromStopFk: result[0].fromStopFk,
      toStopFk: result[0].toStopFk,
      shortNameKor: result[0].shortNameKor,
      shortNameEng: result[0].shortNameEng,
    };
  }

  async updateName(routeEntity: RouteEntity, tx: TxType): Promise<RouteEntity> {
    const result = await tx
      .update(route)
      .set({
        shortNameKor: routeEntity.shortNameKor,
        shortNameEng: routeEntity.shortNameEng,
        updatedAt: new Date(),
      })
      .where(eq(route.pk, routeEntity.pk))
      .returning();

    if (result.length === 0) {
      throw new PotgDBError("Failed to update route");
    }

    return {
      pk: result[0].pk,
      fromStopFk: result[0].fromStopFk,
      toStopFk: result[0].toStopFk,
      shortNameKor: result[0].shortNameKor,
      shortNameEng: result[0].shortNameEng,
    };
  }

  private resultToRouteEntity(result: any): RouteEntity {
    return {
      pk: result.routePk,
      shortNameKor: result.shortNameKor,
      shortNameEng: result.shortNameEng,
      fromStopFk: result.fromStopFk,
      fromStop: {
        pk: result.fromStopFk,
        nameKor: result.fromStopNameKor,
        nameEng: result.fromStopNameEng,
        lat: result.fromStopLat,
        lng: result.fromStopLng,
      },
      toStopFk: result.toStopFk,
      toStop: {
        pk: result.toStopFk,
        nameKor: result.toStopNameKor,
        nameEng: result.toStopNameEng,
        lat: result.toStopLat,
        lng: result.toStopLng,
      },
    };
  }
}
