import { Injectable } from "@nestjs/common";
import { DatabaseService } from "@src/database/database.service";
import { TxType } from "@src/global/types/tx.types";
import { randomUUID } from "node:crypto";
import { PotgDBError } from "@src/global/exceptions/potg-db.error";
import { ReportEntity } from "@src/database/entity/report.entity";
import { report } from "../../../drizzle/schema/report";

@Injectable()
export class ReportRepository {
  constructor(private readonly dbService: DatabaseService) {}

  async insert(
    reportEntity: ReportEntity,
    tx: TxType,
  ): Promise<ReportEntity | null> {
    const result = await tx
      .insert(report)
      .values({
        pk: reportEntity.pk || randomUUID(),
        potRoomFk: reportEntity.potRoomFk,
        userFk: reportEntity.userFk,
        targetUserFk: reportEntity.targetUserFk,
        reason: reportEntity.reason,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    if (result.length === 0) {
      throw new PotgDBError("Failed to insert report");
    }

    const inserted = result[0];

    return {
      pk: inserted.pk,
      potRoomFk: inserted.potRoomFk,
      userFk: inserted.userFk,
      targetUserFk: inserted.targetUserFk,
      reason: inserted.reason,
      createdAt: inserted.createdAt,
      updatedAt: inserted.updatedAt,
    };
  }
}
