import { Injectable } from '@nestjs/common';
import { HealthIndicatorService, HealthCheckAttempt } from '@nestjs/terminus';
import { sql } from 'drizzle-orm';
import { DatabaseService } from '@src/database/database.service';

@Injectable()
export class DrizzleHealthIndicator {
  constructor(
    private readonly healthIndicatorService: HealthIndicatorService
  ) {}

  pingCheck(key: string, drizzleService: DatabaseService): HealthCheckAttempt {
    return this.healthIndicatorService
      .check(key)
      .attempt(async () => {
        await drizzleService.db.execute(sql`SELECT 1`);
      })
      .withTimeout(1000)
  }
}