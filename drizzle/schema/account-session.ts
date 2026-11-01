import { index, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import type { SessionRecord } from "@gsainfoteam/account-nest";

// @gsainfoteam/account-nest 세션의 refresh token(해시)을 저장합니다.
export const accountSession = pgTable(
  "account_session",
  {
    tokenHash: text("token_hash").primaryKey(),
    sessionId: text("session_id").notNull(),
    subject: text("subject").notNull(),
    claims: jsonb("claims").$type<SessionRecord["claims"]>().notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    usedAt: timestamp("used_at", { withTimezone: true }),
  },
  (table) => [
    index("account_session_session_id_idx").on(table.sessionId),
    index("account_session_subject_idx").on(table.subject),
    index("account_session_expires_at_idx").on(table.expiresAt),
  ],
);
