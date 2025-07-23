import { pgTable, primaryKey, uuid, varchar } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users } from "./users";
import { bank } from "./bank";

/*
CREATE TABLE "user_bank" (
    "user_fk" uuid        NOT NULL,
    "bank_fk" uuid        NOT NULL,
    "account" varchar(64) NOT NULL
);
*/
export const userBank = pgTable(
  "user_bank",
  {
    userFk: uuid("user_fk").notNull(),
    bankFk: uuid("bank_fk").notNull(),
    account: varchar("account", { length: 64 }).notNull(), // '-' 없이 저장
  },
  (table) => [primaryKey({ columns: [table.userFk, table.bankFk] })],
);

export const userBankRelations = relations(userBank, ({ one }) => ({
  user: one(users, {
    fields: [userBank.userFk],
    references: [users.pk],
  }),
  bank: one(bank, {
    fields: [userBank.bankFk],
    references: [bank.pk],
  }),
}));
