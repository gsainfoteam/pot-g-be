import { LogWriter } from "drizzle-orm/logger";
import { entityKind } from "drizzle-orm";
import { LoggerService } from "@src/global/logger/logger.service";

export class QueryTimeLogWriter implements LogWriter {
  static [entityKind] = "QueryTimeLogWriter";
  private startTime: number = 0;

  constructor(private readonly loggerService: LoggerService) {}

  write(message: string): void {
    const currentTime = Date.now();
    const duration = this.startTime ? currentTime - this.startTime : 0;

    if (this.startTime) {
      this.loggerService.queryTimeLog(`(${duration}ms) ${message}`);
    }
  }

  startTimer(): void {
    this.startTime = Date.now();
  }

  resetTimer(): void {
    this.startTime = 0;
  }
}