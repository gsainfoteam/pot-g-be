import { pgTable, varchar } from "drizzle-orm/pg-core";

/*
CREATE TABLE users (
  id VARCHAR(255) PRIMARY KEY
);
*/
export const users = pgTable("users", {
  id: varchar("id", { length: 255 }).primaryKey(),
});
