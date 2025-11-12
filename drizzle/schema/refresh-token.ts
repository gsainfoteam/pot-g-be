import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

/*
CREATE TABLE "refresh_token" (
    "opaque_hash"   text                     NOT NULL,
    "refresh_token" text                     NOT NULL,
    "created_at"    timestamp with time zone NOT NULL DEFAULT NOW(),
    "updated_at"    timestamp with time zone NOT NULL DEFAULT NOW(),
    "user_pk"       uuid                     NOT NULL
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
  userPk: uuid("user_pk").notNull(),
});
