import { index, jsonb, pgTable, timestamp, uuid } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { potRoom } from "./pot-room";
import { fofoChatMsg, fofoChatType } from "./fofo-chat-msg";

/*
CREATE TABLE "fofo_chat_reservation" (
    "pk"                 uuid                     NOT NULL,
    "pot_fk"             uuid                     NOT NULL,
    "fofo_chat_msg_type" popo_chat_type           NOT NULL,
    "send_after"         timestamp with time zone NOT NULL,
    "created_at"         timestamp with time zone NOT NULL DEFAULT NOW(),
    "updated_at"         timestamp with time zone NOT NULL DEFAULT NOW(),
    "format_arguments"   jsonb                    NULL
);
CREATE INDEX "fofo_chat_reservation_pot_fk_fofo_chat_msg_type_index"
    ON "fofo_chat_reservation" ("pot_fk", "fofo_chat_msg_type");
*/
export const fofoChatReservation = pgTable(
  "fofo_chat_reservation",
  {
    pk: uuid("pk").primaryKey().notNull(),
    potFk: uuid("pot_fk")
      .notNull()
      .references(() => potRoom.pk),
    fofoChatMsgType: fofoChatType("fofo_chat_msg_type")
      .notNull()
      .references(() => fofoChatMsg.type),
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
    index().on(table.sendAfter),
    index().on(table.potFk),
    index().on(table.fofoChatMsgType),
    index().on(table.potFk, table.fofoChatMsgType),
  ],
);

export const fofoChatReservationRelations = relations(
  fofoChatReservation,
  ({ one }) => ({
    pot: one(potRoom, {
      fields: [fofoChatReservation.potFk],
      references: [potRoom.pk],
    }),
    fofoChatMsg: one(fofoChatMsg, {
      fields: [fofoChatReservation.fofoChatMsgType],
      references: [fofoChatMsg.type],
    }),
  }),
);
