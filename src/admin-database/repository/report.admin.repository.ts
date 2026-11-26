import { Injectable } from "@nestjs/common";
import { eq } from "drizzle-orm";
import { DatabaseService } from "@src/database/database.service";
import { report } from "@drizzle-schema/report";

/**
 * 어드민 페이지 전용 report 조회 레포지토리입니다.
 */
@Injectable()
export class ReportAdminRepository {
  constructor(private readonly dbService: DatabaseService) {}

  /*
  SELECT pk FROM report WHERE pot_room_fk = ?1 LIMIT 1;
   */
  async existsByPotRoomPk(potPk: string): Promise<boolean> {
    const result = await this.dbService.db
      .select({ pk: report.pk })
      .from(report)
      .where(eq(report.potRoomFk, potPk))
      .limit(1);

    return result.length > 0;
  }
}
