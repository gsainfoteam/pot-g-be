import { Injectable, OnModuleInit } from "@nestjs/common";
import { AppVersionEntity } from "@src/database/entity/app-version.entity";
import { AppVersionRepository } from "@src/database/repository/app-version.repository";
import { VersionDto } from "@src/app-version/dto/version.dto";

@Injectable()
export class AppVersionService implements OnModuleInit {
  private cachedAppVersion: AppVersionEntity;

  constructor(private readonly appVersionRepository: AppVersionRepository) {}

  async onModuleInit() {
    await this.cacheAppVersion();
  }

  async getVersion(): Promise<VersionDto> {
    return {
      ios_min_version: this.cachedAppVersion.iosMinVersion,
      ios_latest_version: this.cachedAppVersion.iosLatestVersion,
      aos_min_version: this.cachedAppVersion.aosMinVersion,
      aos_latest_version: this.cachedAppVersion.aosLatestVersion,
    };
  }

  private async cacheAppVersion() {
    this.cachedAppVersion = await this.appVersionRepository.findOne();
  }
}
