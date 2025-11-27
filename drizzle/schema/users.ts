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
import { report } from "./report";

/*
CREATE TABLE "users" (
    "pk"            uuid                     NOT NULL,
    "is_deleted"    boolean                  NOT NULL,
    "idp_sub"       varchar(64)              NOT NULL,
    "name"          varchar(32)              NOT NULL,
    "email"         varchar(64)              NOT NULL,
    "created_at"    timestamp with time zone NOT NULL DEFAULT NOW(),
    "updated_at"    timestamp with time zone NOT NULL DEFAULT NOW()
);
*/
export const users = pgTable("users", {
  pk: uuid("pk").primaryKey().notNull(),
  isDeleted: boolean("is_deleted").notNull(),
  idpSub: varchar("idp_sub", { length: 64 }).notNull(),
  name: varchar("name", { length: 32 }).notNull(),
  email: varchar("email", { length: 64 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const usersRelations = relations(users, ({ many }) => ({
  userPotRooms: many(userPotRoom),
  devices: many(device),
  userBanks: many(userBank),
  reports: many(report),
}));
