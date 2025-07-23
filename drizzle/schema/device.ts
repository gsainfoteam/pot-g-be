import { pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users } from "./users";
import { userAlarmSetting } from "./user-alarm-setting";

/*
CREATE TABLE "device" (
    "pk"         uuid                     NOT NULL,
    "user_fk"    uuid                     NOT NULL,
    "fcm_token"  varchar(64)              NOT NULL,
    "os"         varchar(4)               NOT NULL,
    "version"    varchar(8)               NOT NULL,
    "created_at" timestamp with time zone NOT NULL,
    "updated_at" timestamp with time zone NOT NULL
);
*/
export const device = pgTable("device", {
  pk: uuid("pk").primaryKey().notNull(),
  userFk: uuid("user_fk").notNull(),
  fcmToken: varchar("fcm_token", { length: 64 }).notNull(),
  os: varchar("os", { length: 4 }).notNull(),
  version: varchar("version", { length: 8 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});

export const deviceRelations = relations(device, ({ one, many }) => ({
  user: one(users, {
    fields: [device.userFk],
    references: [users.pk],
  }),
  userAlarmSettings: many(userAlarmSetting),
}));
