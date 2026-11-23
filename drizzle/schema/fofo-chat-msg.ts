import {
  boolean,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

// Keep the existing DB enum names and mobile-released message labels.
export const fofoChatType = pgEnum("popo_chat_type", [
  "popo-departure-confirm-request-v1",
  "popo-departure-confirmed-v1",
  "popo-reminder-taxi-call-v1",
  "popo-accounting-reminder-v1",
  "popo-accounting-request-v1",
  "popo-auto-archive-no-departure-confirm-v1",
  "popo-auto-archive-accounting-fin-v1",
  "popo-auto-archive-v1",
  "fofo-delay-check-request-v1",
]);

export const fofoActionBtnType = pgEnum("popo_action_btn_type", [
  "departure-confirm-btn",
  "taxi-call-btn",
  "accounting-request-btn",
  "accounting-info-check-btn",
  "accounting-process-btn",
  "delay-check-btn",
]);

export type FofoChatStringType = (typeof fofoChatType.enumValues)[number];
export type FofoActionBtnStringType =
  (typeof fofoActionBtnType.enumValues)[number];

/*
CREATE TABLE "fofo_chat_msg" (
    "type" popo_chat_type NOT NULL, // pk
    "action_btns" popo_action_btn_type[] NOT NULL,
    "created_at" timestamp with time zone NOT NULL DEFAULT now(),
    "updated_at" timestamp with time zone NOT NULL DEFAULT now(),
    "message" text NOT NULL,
    "enabled" boolean NOT NULL DEFAULT true,
    "offset_minutes" integer // 기준 시각 대비 발송 시점(분), 음수 = 전, 양수 = 후, NULL = 즉시 발송
);
*/
export const fofoChatMsg = pgTable("fofo_chat_msg", {
  type: fofoChatType("type").primaryKey().notNull(),
  actionBtns: fofoActionBtnType("action_btns").array().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  message: text("message").notNull(),
  enabled: boolean("enabled").notNull().default(true),
  // 기준 시각은 코드(fofo-message-meta.ts)에서 정해지고, 여기에는 그 시각 대비 오프셋만 저장한다.
  offsetMinutes: integer("offset_minutes"),
});
