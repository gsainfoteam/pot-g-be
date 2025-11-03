import {
  boolean,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users } from "./users";
import { userAlarmSetting } from "./user-alarm-setting";

/*
CREATE TABLE "device" (
    "pk"         uuid                     NOT NULL,
    "user_fk"    uuid                     NOT NULL,
    "os"         varchar(4)               NOT NULL,
    "version"    varchar(8)               NOT NULL,
    "created_at" timestamp with time zone NOT NULL DEFAULT NOW(),
    "updated_at" timestamp with time zone NOT NULL DEFAULT NOW(),
    "device_id"  varchar(64)              NOT NULL,
    "fcm_token"  text                     NOT NULL,
    "logged_in" boolean                  NOT NULL DEFAULT FALSE
);
*/
export const device = pgTable("device", {
  pk: uuid("pk").primaryKey().notNull(),
  userFk: uuid("user_fk").notNull(),
  os: varchar("os", { length: 4 }).notNull(),
  version: varchar("version", { length: 8 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  deviceId: varchar("device_id", { length: 64 }).notNull(),
  fcmToken: text("fcm_token").notNull(),
  loggedIn: boolean("logged_in").notNull().default(false),
});

export const deviceRelations = relations(device, ({ one, many }) => ({
  user: one(users, {
    fields: [device.userFk],
    references: [users.pk],
  }),
  userAlarmSettings: many(userAlarmSetting),
}));
