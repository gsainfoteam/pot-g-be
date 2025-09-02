import { pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { route } from "./route";

/*
CREATE TABLE "stops" (
    "pk"         uuid                     NOT NULL,
    "name_kor"   varchar(127)             NOT NULL,
    "name_eng"   varchar(127)             NOT NULL,
    "created_at" timestamp with time zone NOT NULL DEFAULT NOW(),
    "updated_at" timestamp with time zone NOT NULL DEFAULT NOW()
);
*/
export const stops = pgTable("stops", {
  pk: uuid("pk").primaryKey().notNull(),
  nameKor: varchar("name_kor", { length: 127 }).notNull(),
  nameEng: varchar("name_eng", { length: 127 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const stopsRelations = relations(stops, ({ many }) => ({
  routes: many(route),
}));
