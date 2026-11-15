import { ApiInternalServerErrorResponse } from "@nestjs/swagger";
import { DatabaseService } from "../database/database.service";
import {
  ApiOkResponse,
  ApiOperation,
  ApiServiceUnavailableResponse,
  ApiTags,
} from "@nestjs/swagger";
import { HealthDto } from "./dto/health.dto";
import { HttpErrorDto } from "@src/global/dto/http-error.dto";
import { Controller, Get } from "@nestjs/common";
import {
  HealthCheck,
  HealthCheckService,
  MemoryHealthIndicator,
} from "@nestjs/terminus";
import { DrizzleHealthIndicator } from "./drizzle.health";

// Controller for health check
@ApiInternalServerErrorResponse({
  type: HttpErrorDto,
  description: "서버 내부 오류",
})
@Controller("health")
@ApiTags("Health")
export class HealthController {
  constructor(
    private readonly drizzleService: DatabaseService,
    private readonly health: HealthCheckService,
    private readonly drizzleIndicator: DrizzleHealthIndicator,
    private readonly memoryIndicator: MemoryHealthIndicator,
  ) {}

  @Get()
  @ApiOperation({
    summary: "DB 및 메모리 상태 확인",
    description: "DB 연결 및 RSS 메모리 400 MiB 한도를 검사합니다.",
  })
  @ApiOkResponse({ type: HealthDto })
  @ApiServiceUnavailableResponse({
    type: HttpErrorDto,
    description: "하나 이상의 상태 검사 실패 (전역 예외 필터 응답)",
  })
  @HealthCheck()
  async check() {
    return await this.health.check([
      () => this.drizzleIndicator.pingCheck("database", this.drizzleService),
      () => this.memoryIndicator.checkRSS("memory_rss", 1024 * 1024 * 400),
    ]);
  }
}
