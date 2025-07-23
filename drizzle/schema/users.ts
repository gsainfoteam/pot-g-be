import {
  boolean,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { userPotRoom } from "./user-pot-room";
import { device } from "./device";
import { userBank } from "./user-bank";

/*
CREATE TABLE "users" (
    "pk"            uuid                     NOT NULL,
    "is_deleted"    boolean                  NOT NULL,
    "name"          varchar(32)              NOT NULL,
    "created_at"    timestamp with time zone NOT NULL,
    "updated_at"    timestamp with time zone NOT NULL
);
*/
export const users = pgTable("users", {
  pk: uuid("pk").primaryKey().notNull(),
  isDeleted: boolean("is_deleted").notNull(),
  name: varchar("name", { length: 32 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
  userPotRooms: many(userPotRoom),
  devices: many(device),
  userBanks: many(userBank),
}));
