import { pgTable, primaryKey, uuid } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users } from "./users";
import { potRoom } from "./pot-room";

/*
CREATE TABLE "user_pot_room" (
    "user_fk"       uuid NOT NULL,
    "pot_room_fk"   uuid NOT NULL
);
*/
export const userPotRoom = pgTable(
  "user_pot_room",
  {
    userFk: uuid("user_fk").notNull(),
    potRoomFk: uuid("pot_room_fk").notNull(),
  },
  (table) => [primaryKey({ columns: [table.userFk, table.potRoomFk] })],
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
