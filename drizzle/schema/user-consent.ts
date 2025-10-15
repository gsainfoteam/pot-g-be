import {
  pgTable,
  primaryKey,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users } from "./users";

/*
CREATE TABLE "user_consent" (
    "user_fk"    uuid         NOT NULL,
    "term"       varchar(255) NOT NULL,
    "created_at"  timestamp with time zone NOT NULL DEFAULT NOW(),
    "updated_at"  timestamp with time zone NOT NULL DEFAULT NOW()
);
*/
export const userConsent = pgTable(
  "user_consent",
  {
    userFk: uuid("user_fk").notNull(),
    term: varchar("term", { length: 255 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.userFk, table.term] })],
);

export const userConsentRelations = relations(userConsent, ({ one }) => ({
  user: one(users, {
    fields: [userConsent.userFk],
    references: [users.pk],
  }),
}));
