import { pgEnum, pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

/*
CREATE TYPE "admin_account_role" AS ENUM ('admin', 'superadmin');

CREATE TABLE "admin_account" (
    "pk"         uuid                     NOT NULL,
    "email"      varchar(64)              NOT NULL,
    "role"       admin_account_role       NOT NULL DEFAULT 'admin',
    "created_at" timestamp with time zone NOT NULL DEFAULT NOW(),
    "updated_at" timestamp with time zone NOT NULL DEFAULT NOW()
);
*/
export const adminAccountRole = pgEnum("admin_account_role", [
  "admin",
  "superadmin",
]);

export const adminAccount = pgTable("admin_account", {
  pk: uuid("pk").primaryKey().notNull(),
  email: varchar("email", { length: 64 }).notNull().unique(),
  role: adminAccountRole("role").notNull().default("admin"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
