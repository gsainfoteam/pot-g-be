import { LogWriter } from "drizzle-orm/logger";
import { entityKind } from "drizzle-orm";
import { LoggerService } from "@src/global/logger/logger.service";

export class QueryTimeLogWriter implements LogWriter {
  static [entityKind] = "QueryTimeLogWriter";
  private startTime: number = 0;

  // 성능 측정이 필요한 쿼리 테이블/키워드 목록
  private readonly targetQueries = [
    'pot_room',
    'user_pot_room',
    'user',
    'pot_event',
    'getUserPotRoomList',
    'searchPotList',
    'getPotRoomInfoByPk'
  ];

  constructor(private readonly loggerService: LoggerService) {}

  write(message: string): void {
    const currentTime = Date.now();
    const duration = this.startTime ? currentTime - this.startTime : 0;

    if (this.startTime) {
      const shouldLog = this.targetQueries.some(keyword =>
        message.toLowerCase().includes(keyword.toLowerCase())
      );

      if (shouldLog) {
        this.loggerService.queryTimeLog(`Query executed in ${duration}ms: ${message}`);
      }
    }
  }

  startTimer(): void {
    this.startTime = Date.now();
  }

  resetTimer(): void {
    this.startTime = 0;
  }
}