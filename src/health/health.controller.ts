import { DatabaseService } from '../database/database.service';
import { Controller, Get } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckService,
  PrismaHealthIndicator,
} from '@nestjs/terminus';
import { DrizzleHealthIndicator } from './drizzle.health';

// Controller for health check
@Controller('health')
export class HealthController {
  constructor(
    private readonly drizzleService: DatabaseService,
    private readonly health: HealthCheckService,
    private readonly drizzle: DrizzleHealthIndicator,
    private readonly prisma: PrismaHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  async check() {
    return await this.health.check([
      () => this.drizzle.pingCheck('database', this.drizzleService),
    ]);
  }
}