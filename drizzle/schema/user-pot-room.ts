import { boolean, pgTable, primaryKey, uuid } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users } from "./users";
import { potRoom } from "./pot-room";

/*
CREATE TABLE "user_pot_room" (
    "pot_room_fk"   uuid NOT NULL,
    "user_fk"       uuid NOT NULL,
    "is_host"       boolean NOT NULL DEFAULT FALSE
);
*/
export const userPotRoom = pgTable(
  "user_pot_room",
  {
    potRoomFk: uuid("pot_room_fk").notNull(),
    userFk: uuid("user_fk").notNull(),
    isHost: boolean("is_host").notNull().default(false),
  },
  (table) => [primaryKey({ columns: [table.potRoomFk, table.userFk] })],
);

export const userPotRoomRelations = relations(userPotRoom, ({ one }) => ({
  user: one(users, {
    fields: [userPotRoom.userFk],
    references: [users.pk],
  }),
  potRoom: one(potRoom, {
    fields: [userPotRoom.potRoomFk],
    references: [potRoom.pk],
  }),
}));
