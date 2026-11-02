import { DatabaseService } from "../database/database.service";
import { Controller, Get } from "@nestjs/common";
import {
  HealthCheck,
  HealthCheckService,
  MemoryHealthIndicator,
  PrismaHealthIndicator,
} from "@nestjs/terminus";
import { DrizzleHealthIndicator } from "./drizzle.health";

// Controller for health check
@Controller("health")
export class HealthController {
  constructor(
    private readonly drizzleService: DatabaseService,
    private readonly health: HealthCheckService,
    private readonly drizzleIndicator: DrizzleHealthIndicator,
    private readonly memoryIndicator: MemoryHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  async check() {
    return await this.health.check([
      () => this.drizzleIndicator.pingCheck("database", this.drizzleService),
      () => this.memoryIndicator.checkRSS("memory_rss", 1024 * 1024 * 200),
    ]);
  }
}
