import { boolean, pgTable, uuid } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { device } from "./device";

/*
CREATE TABLE "user_alarm_setting" (
    "pk"              uuid    NOT NULL,
    "device_fk"       uuid    NOT NULL,
    "any_push"        boolean NOT NULL,
    "chat_push"       boolean NOT NULL,
    "marketing_push"  boolean NOT NULL,
    "pot_in_out_push" boolean NOT NULL
);
*/
export const userAlarmSetting = pgTable("user_alarm_setting", {
  pk: uuid("pk").primaryKey().notNull(),
  deviceFk: uuid("device_fk").notNull(),
  anyPush: boolean("any_push").notNull(),
  chatPush: boolean("chat_push").notNull(),
  marketingPush: boolean("marketing_push").notNull(),
  potInOutPush: boolean("pot_in_out_push").notNull(),
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
