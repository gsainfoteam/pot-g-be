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

// Events and delivery intent are committed together before sending over the network.
export const popoChatDelivery = pgTable(
  "popo_chat_delivery",
  {
    pk: uuid("pk").primaryKey().notNull(),
    potFk: uuid("pot_fk")
      .notNull()
      .references(() => potRoom.pk),
    events: jsonb("events").$type<DeliveryEvent[]>().notNull(),
    userPks: jsonb("user_pks").$type<string[]>().notNull(),
    potName: text("pot_name").notNull(),
    nextAttemptAt: timestamp("next_attempt_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index().on(table.nextAttemptAt)],
);
