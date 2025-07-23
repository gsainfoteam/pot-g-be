import {
  boolean,
  pgTable,
  smallint,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { route } from "./route";
import { userPotRoom } from "./user-pot-room";
import { potEvent } from "./pot-event";

/*
CREATE TABLE "pot_room" (
    "pk"            uuid                     NOT NULL,
    "route_fk"      uuid                     NOT NULL,
    "is_closed"     boolean                  NOT NULL,
    "is_deleted"    boolean                  NOT NULL,
    "max_num"       smallint                 NOT NULL,
    "created_at"    timestamp with time zone NOT NULL,
    "updated_at"    timestamp with time zone NOT NULL,
    "name"          varchar(64)              NOT NULL
);
*/
export const potRoom = pgTable("pot_room", {
  pk: uuid("pk").primaryKey().notNull(),
  routeFk: uuid("route_fk").notNull(),
  isClosed: boolean("is_closed").notNull(),
  isDeleted: boolean("is_deleted").notNull(),
  maxNum: smallint("max_num").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
  name: varchar("name", { length: 64 }).notNull(),
});

export const potRoomRelations = relations(potRoom, ({ one, many }) => ({
  route: one(route, {
    fields: [potRoom.routeFk],
    references: [route.pk],
  }),
  userPotRooms: many(userPotRoom),
  potEvents: many(potEvent),
}));
