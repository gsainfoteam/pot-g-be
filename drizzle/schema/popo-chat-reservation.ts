import { index, jsonb, pgTable, timestamp, uuid } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { potRoom } from "./pot-room";
import { popoChatMsg, popoChatType } from "./popo-chat-msg";

/*
CREATE TABLE "popo_chat_reservation" (
    "pk"                 uuid                     NOT NULL,
    "pot_fk"             uuid                     NOT NULL,
    "popo_chat_msg_type" popo_chat_type           NOT NULL,
    "send_after"         timestamp with time zone NOT NULL,
    "created_at"         timestamp with time zone NOT NULL DEFAULT NOW(),
    "updated_at"         timestamp with time zone NOT NULL DEFAULT NOW(),
    "format_arguments"   jsonb                    NULL
);
CREATE INDEX "idx_popo_chat_reservation_pot_fk_popo_chat_msg_type"
    ON "popo_chat_reservation" ("pot_fk", "popo_chat_msg_type");
*/
export const popoChatReservation = pgTable(
  "popo_chat_reservation",
  {
    pk: uuid("pk").primaryKey().notNull(),
    potFk: uuid("pot_fk")
      .notNull()
      .references(() => potRoom.pk),
    popoChatMsgType: popoChatType("popo_chat_msg_type")
      .notNull()
      .references(() => popoChatMsg.type),
    sendAfter: timestamp("send_after", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    formatArguments: jsonb("format_arguments"),
  },
  (table) => [
    index().on(table.potFk),
    index().on(table.popoChatMsgType),
    index().on(table.potFk, table.popoChatMsgType),
  ],
);

export const popoChatReservationRelations = relations(
  popoChatReservation,
  ({ one }) => ({
    pot: one(potRoom, {
      fields: [popoChatReservation.potFk],
      references: [potRoom.pk],
    }),
    popoChatMsg: one(popoChatMsg, {
      fields: [popoChatReservation.popoChatMsgType],
      references: [popoChatMsg.type],
    }),
  }),
);
