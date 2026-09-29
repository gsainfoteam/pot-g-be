// scripts/seed-admin.ts
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as dotenv from "dotenv";
import { randomUUID } from "node:crypto";
import { adminAccount } from "./schema/admin-account";

// .env 파일 로드
dotenv.config();

async function seedAdmin() {
  const email = process.argv[2];
  const role = process.argv[3] === "admin" ? "admin" : "superadmin";

  if (!email || !email.endsWith("@gistory.me")) {
    console.error(
      "Usage: npm run db:seed-admin -- <email>@gistory.me [admin|superadmin]",
    );
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });
  const db = drizzle(pool);

  console.log(`⏳ Seeding admin account (${role}): ${email}`);

  try {
    await db
      .insert(adminAccount)
      .values({ pk: randomUUID(), email, role })
      .onConflictDoNothing();
    console.log("✅ Admin account seeded successfully");
    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding admin account failed:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

seedAdmin();
