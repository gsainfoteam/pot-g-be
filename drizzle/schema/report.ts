import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users } from "./users";
import { potRoom } from "./pot-room";

/*
CREATE TABLE "report" (
    "pk"             uuid NOT NULL,
    "pot_room_fk"    uuid NOT NULL,
    "user_fk"        uuid NOT NULL,
    "target_user_fk" uuid NOT NULL,
    "created_at"     timestamp with time zone NOT NULL DEFAULT NOW(),
    "updated_at"     timestamp with time zone NOT NULL DEFAULT NOW(),
    "reason"         text NOT NULL
);
*/
export const report = pgTable("report", {
  pk: uuid("pk").primaryKey().notNull(),
  potRoomFk: uuid("pot_room_fk")
    .notNull()
    .references(() => potRoom.pk),
  userFk: uuid("user_fk")
    .notNull()
    .references(() => users.pk),
  targetUserFk: uuid("target_user_fk")
    .notNull()
    .references(() => users.pk),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  reason: text("reason").notNull(),
});

export const reportRelations = relations(report, ({ one }) => ({
  user: one(users, {
    fields: [report.userFk],
    references: [users.pk],
  }),
  targetUser: one(users, {
    fields: [report.targetUserFk],
    references: [users.pk],
  }),
  potRoom: one(potRoom, {
    fields: [report.potRoomFk],
    references: [potRoom.pk],
  }),
}));
