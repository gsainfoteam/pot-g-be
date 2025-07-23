import {
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { potRoom } from "./pot-room";

// potEventType 의 추가는 반드시 맨 아래에 추가 되어야 합니다.
export const potEventType = pgEnum("pot_event_type", [
  "pot_create",
  "chat",
  "user_in",
  "user_out",
  "user_kick",
  "departure_confirm",
  "accounting_request",
  "accounting_confirm",
]);

/*
CREATE TABLE "pot_event" (
    "timestamp"     timestamp with time zone NOT NULL,
    "pot_fk"        uuid                     NOT NULL,
    "type"          pot_event_type           NOT NULL,
    "content"       jsonb                    NOT NULL
);
*/
export const potEvent = pgTable(
  "pot_event",
  {
    timestamp: timestamp("timestamp", { withTimezone: true }).notNull(),
    potFk: uuid("pot_fk").notNull(),
    type: potEventType("type").notNull(),
    content: jsonb("content").notNull(),
  },
  (table) => [primaryKey({ columns: [table.timestamp, table.potFk] })],
);

export const potEventRelations = relations(potEvent, ({ one }) => ({
  potRoom: one(potRoom, {
    fields: [potEvent.potFk],
    references: [potRoom.pk],
  }),
}));
