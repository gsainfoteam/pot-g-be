import { LogWriter } from "drizzle-orm/logger";
import { Logger } from "@nestjs/common";
import { entityKind } from "drizzle-orm";

export class QueryLogWriter implements LogWriter {
  private readonly logger = new Logger(QueryLogWriter.name);
  static [entityKind] = "QueryLogWriter";

  write(message: string): void {
    this.logger.debug(`[DB QUERY]: ${message}`);
  }
}
