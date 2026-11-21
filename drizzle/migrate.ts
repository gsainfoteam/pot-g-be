// scripts/migrate.ts
import { drizzle } from "drizzle-orm/node-postgres";
import { readMigrationFiles } from "drizzle-orm/migrator";
import { PgDialect } from "drizzle-orm/pg-core";
import { Pool } from "pg";
import * as dotenv from "dotenv";
import { readFileSync } from "node:fs";
import { join } from "node:path";

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

    // Commit 0018 before 0019 uses the newly added PostgreSQL enum values.
    const journal = JSON.parse(
      readFileSync(join(config.migrationsFolder, "meta/_journal.json"), "utf8"),
    ) as { entries: { tag: string; when: number }[] };
    const enumMigration = journal.entries.find(
      ({ tag }) => tag === "0018_delay_check_message_types",
    );
    if (!enumMigration || !Number.isFinite(enumMigration.when)) {
      throw new Error("Missing enum migration boundary in migration journal");
    }
    const enumMigrationTime = enumMigration.when;
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
