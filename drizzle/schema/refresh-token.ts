import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

/*
CREATE TABLE "refresh_token" (
    "token_hmac"    text                     NOT NULL,
    "refresh_token" text                     NOT NULL,
    "created_at"    timestamp with time zone NOT NULL DEFAULT NOW(),
    "updated_at"    timestamp with time zone NOT NULL DEFAULT NOW()
);
*/
export const refreshToken = pgTable("refresh_token", {
  tokenHmac: text("token_hmac").primaryKey().notNull(),
  refreshToken: text("refresh_token").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
