import { Injectable } from "@nestjs/common";
import { DatabaseService } from "@src/database/database.service";
import { StopsEntity } from "@src/database/entity/stops.entity";
import { stops } from "../../../drizzle/schema/stops";

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

  private resultToStopsEntity(result: any): StopsEntity {
    return {
      pk: result.pk,
      nameKor: result.nameKor,
      nameEng: result.nameEng,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
    };
  }
}
