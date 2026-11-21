// scripts/migrate.ts
import { drizzle } from "drizzle-orm/node-postgres";
import { readMigrationFiles } from "drizzle-orm/migrator";
import { PgDialect } from "drizzle-orm/pg-core";
import { Pool } from "pg";
import * as dotenv from "dotenv";

// .env 파일 로드
dotenv.config();

async function runMigration() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  const db = drizzle<Record<never, never>>(pool);

  console.log("⏳ Running migrations...");

  try {
    const config = {
      migrationsFolder: "./drizzle",
      migrationsSchema: "public",
    };
    const migrations = readMigrationFiles(config);
    const dialect = new PgDialect();

    // ??? ????? ? enum ?? ????? ?? enum ??? ???? ???.
    const enumMigrationTime = 1795179488847;
    await dialect.migrate(
      migrations.filter(
        ({ folderMillis }) => folderMillis <= enumMigrationTime,
      ),
      db._.session,
      config,
    );
    await dialect.migrate(
      migrations.filter(({ folderMillis }) => folderMillis > enumMigrationTime),
      db._.session,
      config,
    );
    console.log("✅ Migrations completed successfully");
    process.exit(0);
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();
