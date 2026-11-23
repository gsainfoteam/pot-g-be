import {
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { potRoom } from "./pot-room";

type DeliveryEvent = {
  pot_pk: string;
  timestamp: number;
  id: number;
  event_type: string;
  data: unknown;
};

export type DeliveryUserProgress =
  | { stage: "ack"; requestId: string; checkAfter: number }
  | { stage: "push"; pendingDevicePks?: string[] }
  | { stage: "done" };

// Event id -> recipient -> channel progress. Completed devices are never retried.
export type DeliveryProgress = Record<
  string,
  Record<string, DeliveryUserProgress>
>;

// Events and delivery intent are committed together before sending over the network.
export const fofoChatDelivery = pgTable(
  "fofo_chat_delivery",
  {
    pk: uuid("pk").primaryKey().notNull(),
    potFk: uuid("pot_fk")
      .notNull()
      .references(() => potRoom.pk),
    events: jsonb("events").$type<DeliveryEvent[]>().notNull(),
    userPks: jsonb("user_pks").$type<string[]>().notNull(),
    potName: text("pot_name").notNull(),
    progress: jsonb("progress").$type<DeliveryProgress>().notNull().default({}),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    leaseToken: uuid("lease_token"),
    leaseUntil: timestamp("lease_until", { withTimezone: true }),
    nextAttemptAt: timestamp("next_attempt_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index().on(table.nextAttemptAt)],
);
