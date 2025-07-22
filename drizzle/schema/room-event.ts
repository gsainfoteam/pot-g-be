import { jsonb, pgTable, timestamp, varchar } from "drizzle-orm/pg-core";

/*
CREATE TABLE room_event (
  id VARCHAR(255) PRIMARY KEY,
  room_id VARCHAR(255) NOT NULL,
  event_type VARCHAR(255) NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
*/
export const roomEvent = pgTable("room_event", {
  id: varchar("id", { length: 255 }).primaryKey(),
  roomId: varchar("room_id", { length: 255 }).notNull(),
  eventType: varchar("event_type", { length: 255 }).notNull(),
  data: jsonb("data").notNull(),
  timestamp: timestamp("created_at").notNull().defaultNow(),
});
