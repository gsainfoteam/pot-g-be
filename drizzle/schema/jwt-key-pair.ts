import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

/*
CREATE TABLE "jwt_key_pair"
(
    "pk"          uuid                     NOT NULL,
    "public_key"  text                     NOT NULL,
    "private_key" text                     NOT NULL,
    "created_at"  timestamp with time zone NOT NULL DEFAULT NOW(),
    "updated_at"  timestamp with time zone NOT NULL DEFAULT NOW()
);
*/
export const jwtKeyPair = pgTable("jwt_key_pair", {
  pk: uuid("pk").primaryKey().notNull(),
  publicKey: text("public_key").notNull(),
  privateKey: text("private_key").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
