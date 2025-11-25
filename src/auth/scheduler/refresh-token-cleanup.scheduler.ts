import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { RefreshTokenRepository } from "@src/database/repository/refresh-token.repository";
import { DatabaseService } from "@src/database/database.service";

@Injectable()
export class RefreshTokenCleanupScheduler {
  private readonly logger = new Logger(RefreshTokenCleanupScheduler.name);

  constructor(
    private readonly refreshTokenRepository: RefreshTokenRepository,
    private readonly dbService: DatabaseService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleCron() {
    this.logger.log("[RefreshTokenCleanupScheduler] Cleanup Started");
    try {
      const count = await this.refreshTokenRepository.deleteExpiredTokens(
        this.dbService.db,
      );
      this.logger.log(
        `[RefreshTokenCleanupScheduler] Cleanup Finished. count: ${count}`,
      );
    } catch (e) {
      this.logger.error("Failed to cleanup expired refresh tokens", e);
    }
  }
}
