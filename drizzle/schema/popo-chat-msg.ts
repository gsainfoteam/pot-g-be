import { pgEnum, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const popoChatType = pgEnum("popo_chat_type", [
  "popo-departure-confirm-request-v1",
  "popo-departure-confirmed-v1",
  "popo-reminder-taxi-call-v1",
  "popo-accounting-reminder-v1",
  "popo-accounting-request-v1",
]);

export const popoActionBtnType = pgEnum("popo_action_btn_type", [
  "departure-confirm-btn",
  "taxi-call-btn",
  "accounting-request-btn",
  "accounting-info-check-btn",
  "accounting-process-btn",
]);

export type PopoChatStringType = (typeof popoChatType.enumValues)[number];
export type PopoActionBtnStringType =
  (typeof popoActionBtnType.enumValues)[number];

/*
CREATE TABLE "popo-chat-msg" (
    "type" popo_chat_type NOT NULL, // pk
    "action_btns" popo_action_btn_type[] NOT NULL,
    "created_at" timestamp with time zone NOT NULL DEFAULT now(),
    "updated_at" timestamp with time zone NOT NULL DEFAULT now(),
    "message" text NOT NULL
);
*/
export const popoChatMsg = pgTable("popo-chat-msg", {
  type: popoChatType("type").primaryKey().notNull(),
  actionBtns: popoActionBtnType("action_btns").array().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  message: text("message").notNull(),
});
