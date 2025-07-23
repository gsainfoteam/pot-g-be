import { pgTable, smallint, timestamp, uuid } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { potRoom } from "./pot-room";

/*
CREATE TABLE "route" (
    "pk"         uuid                     NOT NULL,
    "from_stop"  smallint                 NOT NULL,
    "to_stop"    smallint                 NOT NULL,
    "created_at" timestamp with time zone NOT NULL,
    "updated_at" timestamp with time zone NOT NULL
);
*/
export const route = pgTable("route", {
  pk: uuid("pk").primaryKey().notNull(),
  fromStop: smallint("from_stop").notNull(),
  toStop: smallint("to_stop").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});

export const routeRelations = relations(route, ({ many }) => ({
  potRooms: many(potRoom),
}));
