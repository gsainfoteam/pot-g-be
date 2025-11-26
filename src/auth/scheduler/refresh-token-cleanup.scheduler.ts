import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { RefreshTokenRepository } from "@src/database/repository/refresh-token.repository";
import { DatabaseService } from "@src/database/database.service";
import { TxType } from "@src/global/types/tx.types";

@Injectable()
export class RefreshTokenCleanupScheduler {
  private readonly logger = new Logger(RefreshTokenCleanupScheduler.name);

  constructor(
    private readonly refreshTokenRepository: RefreshTokenRepository,
    private readonly dbService: DatabaseService,
  ) {}

  // TODO: When scaling horizontally, multiple server instances will execute this scheduler simultaneously.
  // This can cause race conditions or redundant cleanup operations.
  // Consider adding distributed locking or ensuring only one instance runs the cleanup task.

  @Cron(CronExpression.EVERY_1ST_DAY_OF_MONTH_AT_MIDNIGHT)
  async handleCron() {
    this.logger.log("[RefreshTokenCleanupScheduler] Cleanup Started");
    try {
      const count = await this.dbService.db.transaction(async (tx: TxType) => {
        return await this.refreshTokenRepository.deleteExpiredTokens(tx);
    });
      this.logger.log(
        `[RefreshTokenCleanupScheduler] Cleanup Finished. count: ${count}`,
      );
    } catch (e) {
      this.logger.error("Failed to cleanup expired refresh tokens", e);
    }
  }
}
