import { boolean, pgTable, text, uuid, varchar } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { userBank } from "./user-bank";

/*
CREATE TABLE "bank" (
    "pk"              uuid        NOT NULL,
    "is_securities"   boolean     NOT NULL,
    "bank_short_name" varchar(64) NOT NULL,
    "bank_full_name"  varchar(64) NOT NULL,
    "logo"            text        NOT NULL
);
*/
export const bank = pgTable("bank", {
  pk: uuid("pk").primaryKey().notNull(),
  isSecurities: boolean("is_securities").notNull(),
  bankShortName: varchar("bank_short_name", { length: 64 }).notNull(),
  bankFullName: varchar("bank_full_name", { length: 64 }).notNull(),
  logo: text("logo").notNull(),
});

export const bankRelations = relations(bank, ({ many }) => ({
  userBanks: many(userBank),
}));
