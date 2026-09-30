import { Injectable } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { DatabaseService } from "@src/database/database.service";
import { StopsEntity } from "@src/database/entity/stops.entity";
import { stops } from "../../../drizzle/schema/stops";
import { PotgDBError } from "@src/global/exceptions/potg-db.error";
import { TxType } from "@src/global/types/tx.types";

@Injectable()
export class StopsRepository {
  constructor(private readonly dbService: DatabaseService) {}

  /*
  SELECT * from stops;
   */
  async findAll(): Promise<StopsEntity[]> {
    const results = await this.dbService.db.select().from(stops);

    return results.map((result) => this.resultToStopsEntity(result));
  }

  /*
  SELECT * from stops WHERE pk = ?1;
   */
  async findByPk(pk: string): Promise<StopsEntity | null> {
    const results = await this.dbService.db
      .select()
      .from(stops)
      .where(eq(stops.pk, pk));

    if (results.length === 0) {
      return null;
    }

    return this.resultToStopsEntity(results[0]);
  }

  async insert(stopEntity: StopsEntity, tx: TxType): Promise<StopsEntity> {
    const result = await tx
      .insert(stops)
      .values({
        pk: stopEntity.pk || randomUUID(),
        nameKor: stopEntity.nameKor,
        nameEng: stopEntity.nameEng,
        lat: stopEntity.lat,
        lng: stopEntity.lng,
      })
      .returning();

    if (result.length === 0) {
      throw new PotgDBError("Failed to insert stop");
    }

    return this.resultToStopsEntity(result[0]);
  }

  private resultToStopsEntity(result: any): StopsEntity {
    return {
      pk: result.pk,
      nameKor: result.nameKor,
      nameEng: result.nameEng,
      lat: result.lat,
      lng: result.lng,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
    };
  }
}
