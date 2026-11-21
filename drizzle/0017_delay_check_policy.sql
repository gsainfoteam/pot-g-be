CREATE TABLE IF NOT EXISTS "delay_check_policy" (
	"key" varchar(32) PRIMARY KEY NOT NULL,
	"enabled" boolean DEFAULT false NOT NULL,
	"minutes_before_departure" integer DEFAULT 10 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "delay_check_policy_singleton" CHECK ("delay_check_policy"."key" = 'default'),
	CONSTRAINT "delay_check_policy_positive_minutes" CHECK ("delay_check_policy"."minutes_before_departure" >= 1)
);

--> statement-breakpoint
INSERT INTO "delay_check_policy" (
  "key",
  "enabled",
  "minutes_before_departure"
)
VALUES ('default', false, 10)
ON CONFLICT ("key") DO NOTHING;
--> statement-breakpoint
ALTER TABLE "delay_check_policy" ALTER COLUMN "minutes_before_departure" SET DEFAULT 10;
