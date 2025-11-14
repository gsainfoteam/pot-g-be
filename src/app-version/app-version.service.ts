import { Injectable, OnModuleInit } from "@nestjs/common";
import { AppVersionEntity } from "@src/database/entity/app-version.entity";
import { AppVersionRepository } from "@src/database/repository/app-version.repository";
import { VersionDto } from "@src/app-version/dto/version.dto";
import { VersionUpdateDto } from "@src/app-version/dto/version.update.dto";
import { DatabaseService } from "@src/database/database.service";
import { TxType } from "@src/global/types/tx.types";

@Injectable()
export class AppVersionService implements OnModuleInit {
  private cachedAppVersion: AppVersionEntity;

  constructor(
    private readonly dbService: DatabaseService,
    private readonly appVersionRepository: AppVersionRepository,
  ) {}

  async onModuleInit() {
    await this.cacheAppVersion();
  }

  getVersion(): VersionDto {
    return {
      ios_min_version: this.cachedAppVersion.iosMinVersion,
      ios_latest_version: this.cachedAppVersion.iosLatestVersion,
      aos_min_version: this.cachedAppVersion.aosMinVersion,
      aos_latest_version: this.cachedAppVersion.aosLatestVersion,
    };
  }

  async updateVersion(req: VersionUpdateDto): Promise<VersionDto> {
    if (!this.cachedAppVersion) {
      await this.cacheAppVersion();
    }
    const oldVersion = { ...this.cachedAppVersion };

    if (req.ios_min_version !== undefined) {
      oldVersion.iosMinVersion = req.ios_min_version;
    }
    if (req.ios_latest_version !== undefined) {
      oldVersion.iosLatestVersion = req.ios_latest_version;
    }
    if (req.aos_min_version !== undefined) {
      oldVersion.aosMinVersion = req.aos_min_version;
    }
    if (req.aos_latest_version !== undefined) {
      oldVersion.aosLatestVersion = req.aos_latest_version;
    }

    this.cachedAppVersion = await this.dbService.db.transaction(
      async (tx: TxType) => {
        return await this.appVersionRepository.save(oldVersion, tx);
      },
    );
    return this.getVersion();
  }

  private async cacheAppVersion() {
    this.cachedAppVersion = await this.appVersionRepository.findOne();
  }
}
