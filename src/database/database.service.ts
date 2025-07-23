import type { OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { Injectable, Logger } from "@nestjs/common";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DatabaseService.name);
  private readonly pool: Pool;
  public readonly db: ReturnType<typeof drizzle>;

  constructor(private readonly configService: ConfigService) {
    this.pool = new Pool({
      connectionString: this.configService.get<string>("DATABASE_URL"),
    });
    this.db = drizzle({ client: this.pool, logger: true });
  }

  async onModuleInit() {
    try {
      const client = await this.pool.connect();
      client.release();
      this.logger.log("Database connection established successfully");
    } catch (error) {
      this.logger.error("Failed to connect to the database:", error);
      throw error;
    }
  }

  async onModuleDestroy() {
    await this.pool.end();
  }
}
