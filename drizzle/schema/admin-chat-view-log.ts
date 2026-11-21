import { index, pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { potRoom } from "./pot-room";

/*
CREATE TABLE "admin_chat_view_log" (
    "pk"          uuid                     NOT NULL,
    "pot_room_fk" uuid                     NOT NULL,
    "admin_email" varchar(64)              NOT NULL,
    "created_at"  timestamp with time zone NOT NULL DEFAULT NOW()
);
*/
export const adminChatViewLog = pgTable(
  "admin_chat_view_log",
  {
    pk: uuid("pk").primaryKey().notNull(),
    potRoomFk: uuid("pot_room_fk")
      .notNull()
      .references(() => potRoom.pk),
    adminEmail: varchar("admin_email", { length: 64 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("admin_chat_view_log_pot_room_fk_idx").on(table.potRoomFk)],
);
