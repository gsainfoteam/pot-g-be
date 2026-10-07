import { Injectable } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { DatabaseService } from "@src/database/database.service";
import { RouteEntity } from "@src/database/entity/route.entity";
import { route } from "../../../drizzle/schema/route";
import { PotgDBError } from "@src/global/exceptions/potg-db.error";
import { TxType } from "@src/global/types/tx.types";

@Injectable()
export class RouteAdminRepository {
  constructor(private readonly dbService: DatabaseService) {}

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
      isDeleted: result[0].isDeleted,
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
      isDeleted: result[0].isDeleted,
    };
  }

  async updateIsDeleted(
    routeEntity: RouteEntity,
    tx: TxType,
  ): Promise<RouteEntity> {
    const result = await tx
      .update(route)
      .set({
        isDeleted: routeEntity.isDeleted,
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
      isDeleted: result[0].isDeleted,
    };
  }
}
