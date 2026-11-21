import { sql } from "drizzle-orm";
import {boolean, check, integer, pgTable, timestamp, varchar,} from "drizzle-orm/pg-core";

export const delayCheckPolicy = pgTable(
  "delay_check_policy",
  {
    key: varchar("key", { length: 32 }).primaryKey(),

    enabled: boolean("enabled")
      .notNull()
      .default(false),

    minutesBeforeDeparture: integer("minutes_before_departure")
      .notNull()
      .default(10),

    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check(
      "delay_check_policy_singleton",
      sql`${table.key} = 'default'`,
    ),
    check(
      "delay_check_policy_positive_minutes",
      sql`${table.minutesBeforeDeparture} >= 1`,
    ),
  ],
);
