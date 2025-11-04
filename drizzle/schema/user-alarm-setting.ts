import { boolean, pgTable, timestamp, uuid } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { device } from "./device";

/*
CREATE TABLE "user_alarm_setting" (
    "pk"              uuid    NOT NULL,
    "device_fk"       uuid    NOT NULL,
    "chat_push"       boolean NOT NULL DEFAULT TRUE,
    "marketing_push"  boolean NOT NULL DEFAULT TRUE,
    "pot_in_out_push" boolean NOT NULL DEFAULT TRUE,
    "created_at" timestamp with time zone NOT NULL DEFAULT NOW(),
    "updated_at" timestamp with time zone NOT NULL DEFAULT NOW()
);
*/
export const userAlarmSetting = pgTable("user_alarm_setting", {
  pk: uuid("pk").primaryKey().notNull(),
  deviceFk: uuid("device_fk").notNull(),
  chatPush: boolean("chat_push").notNull().default(true),
  marketingPush: boolean("marketing_push").notNull().default(true),
  potInOutPush: boolean("pot_in_out_push").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const userAlarmSettingRelations = relations(
  userAlarmSetting,
  ({ one }) => ({
    device: one(device, {
      fields: [userAlarmSetting.deviceFk],
      references: [device.pk],
    }),
  }),
);
