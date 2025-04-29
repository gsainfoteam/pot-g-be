import { jsonb, pgTable, timestamp, varchar } from "drizzle-orm/pg-core";

export const roomEvent = pgTable("room_event", {
  id: varchar("id", { length: 255 }).primaryKey(),
  roomId: varchar("room_id", { length: 255 }).notNull(),
  eventType: varchar("event_type", { length: 255 }).notNull(),
  data: jsonb("data").notNull(),
  timestamp: timestamp("created_at").notNull().defaultNow(),
});
