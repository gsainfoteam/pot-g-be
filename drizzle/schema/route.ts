import { pgTable, timestamp, uuid } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { potRoom } from "./pot-room";
import { stops } from "./stops";

/*
CREATE TABLE "route" (
    "pk"             uuid                     NOT NULL,
    "from_stop_fk"   uuid                     NOT NULL,
    "to_stop_fk"     uuid                     NOT NULL,
    "short_name_kor" varchar(64)              NOT NULL,
    "short_name_eng" varchar(64)              NOT NULL,
    "created_at"     timestamp with time zone NOT NULL DEFAULT NOW(),
    "updated_at"     timestamp with time zone NOT NULL DEFAULT NOW()
);
*/
export const route = pgTable("route", {
  pk: uuid("pk").primaryKey().notNull(),
  fromStopFk: uuid("from_stop_fk").notNull(),
  toStopFk: uuid("to_stop_fk").notNull(),
  shortNameKor: uuid("short_name_kor").notNull(),
  shortNameEng: uuid("short_name_eng").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const routeRelations = relations(route, ({ one, many }) => ({
  fromStopRef: one(stops, {
    fields: [route.fromStopFk],
    references: [stops.pk],
  }),
  toStopRef: one(stops, {
    fields: [route.toStopFk],
    references: [stops.pk],
  }),
  potRooms: many(potRoom),
}));
