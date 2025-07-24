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
    "pk"                     uuid                     NOT NULL,
    "route_fk"               uuid                     NOT NULL,
    "is_archived"            boolean                  NOT NULL DEFAULT FALSE,
    "is_deleted"             boolean                  NOT NULL DEFAULT FALSE,
    "is_departure_confirmed" boolean                  NOT NULL DEFAULT FALSE,
    "max_capacity"           smallint                 NOT NULL,
    "starts_at"              timestamp with time zone NOT NULL,
    "ends_at"                timestamp with time zone NOT NULL,
    "created_at"             timestamp with time zone NOT NULL DEFAULT NOW(),
    "updated_at"             timestamp with time zone NOT NULL DEFAULT NOW(),
    "name"                   varchar(64)              NOT NULL
);
*/
export const potRoom = pgTable("pot_room", {
  pk: uuid("pk").primaryKey().notNull(),
  routeFk: uuid("route_fk").notNull(),
  isArchived: boolean("is_archived").notNull().default(false),
  isDeleted: boolean("is_deleted").notNull().default(false),
  isDepartureConfirmed: boolean("is_departure_confirmed")
    .notNull()
    .default(false),
  maxCapacity: smallint("max_capacity").notNull(),
  startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
  endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
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
