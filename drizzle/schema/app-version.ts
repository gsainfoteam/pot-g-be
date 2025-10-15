import { pgTable, varchar } from "drizzle-orm/pg-core";

/*
CREATE TABLE "app_version" (
    "ios_min_version"    VARCHAR(32) NOT NULL,
    "ios_latest_version" VARCHAR(32) NOT NULL,
    "aos_min_version"    VARCHAR(32) NOT NULL,
    "aos_latest_version" VARCHAR(32) NOT NULL
);
*/
export const appVersion = pgTable("app_version", {
  iosMinVersion: varchar("ios_min_version", { length: 32 }).notNull(),
  iosLatestVersion: varchar("ios_latest_version", { length: 32 }).notNull(),
  aosMinVersion: varchar("aos_min_version", { length: 32 }).notNull(),
  aosLatestVersion: varchar("aos_latest_version", { length: 32 }).notNull(),
});
