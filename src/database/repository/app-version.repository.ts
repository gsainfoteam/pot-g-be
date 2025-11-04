import { Injectable } from "@nestjs/common";
import { DatabaseService } from "@src/database/database.service";
import { AppVersionEntity } from "@src/database/entity/app-version.entity";
import { appVersion } from "../../../drizzle/schema/app-version";
import { PotgDBError } from "@src/global/exceptions/potg-db.error";

@Injectable()
export class AppVersionRepository {
  constructor(private readonly dbService: DatabaseService) {}

  /*
  SELECT * from app_version;
   */
  async findOne(): Promise<AppVersionEntity> {
    const results = await this.dbService.db
      .select({
        iosMinVersion: appVersion.iosMinVersion,
        iosLatestVersion: appVersion.iosLatestVersion,
        aosMinVersion: appVersion.aosMinVersion,
        aosLatestVersion: appVersion.aosLatestVersion,
      })
      .from(appVersion);

    if (results.length === 0) {
      throw new PotgDBError("No app version found");
    }

    const firstResult = results[0];
    return this.resultToAppVersionEntity(firstResult);
  }

  private resultToAppVersionEntity(result: any): AppVersionEntity {
    return {
      iosMinVersion: result.iosMinVersion,
      iosLatestVersion: result.iosLatestVersion,
      aosMinVersion: result.aosMinVersion,
      aosLatestVersion: result.aosLatestVersion,
    };
  }
}
