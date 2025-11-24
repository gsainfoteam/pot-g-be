import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

/*
CREATE TABLE "refresh_token" (
    "opaque_hash"   text                     NOT NULL,
    "refresh_token" text                     NOT NULL,
    "created_at"    timestamp with time zone NOT NULL DEFAULT NOW(),
    "updated_at"    timestamp with time zone NOT NULL DEFAULT NOW(),
    "expires_at"    timestamp with time zone NOT NULL DEFAULT '2026-01-01'
);
*/
export const refreshToken = pgTable("refresh_token", {
  opaqueHash: text("opaque_hash").primaryKey().notNull(),
  refreshToken: text("refresh_token").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  expiresAt: timestamp("expires_at", { withTimezone: true })
    .notNull()
    .default(sql`'2026-01-01'`),
});
