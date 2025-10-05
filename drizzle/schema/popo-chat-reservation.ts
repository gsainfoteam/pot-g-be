import { pgTable, timestamp, uuid } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { potRoom } from "./pot-room";
import { popoChatMsg, popoChatType } from "./popo-chat-msg";

/*
CREATE TABLE "popo-chat-reservation" (
    "pk"                 uuid                     NOT NULL,
    "pot_fk"             uuid                     NOT NULL,
    "popo_chat_msg_type" popo_chat_type           NOT NULL,
    "send_after"         timestamp with time zone NOT NULL,
    "created_at"         timestamp with time zone NOT NULL DEFAULT NOW(),
    "updated_at"         timestamp with time zone NOT NULL DEFAULT NOW(),
);
CREATE INDEX "idx_popo_chat_reservation_popo_chat_msg_fk_pot_fk"
    ON "popo-chat-reservation" ("popo_chat_msg_fk", "pot_fk");
*/
export const popoChatReservation = pgTable("popo-chat-reservation", {
  pk: uuid("pk").primaryKey().notNull(),
  potFk: uuid("pot_fk").notNull(),
  popoChatMsgType: popoChatType("popo_chat_msg_type").notNull(),
  sendAfter: timestamp("send_after", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

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
