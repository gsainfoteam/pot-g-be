CREATE TABLE "account_session" (
	"token_hash" text PRIMARY KEY NOT NULL,
	"session_id" text NOT NULL,
	"subject" text NOT NULL,
	"claims" jsonb NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone
);
--> statement-breakpoint
CREATE INDEX "account_session_session_id_idx" ON "account_session" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "account_session_subject_idx" ON "account_session" USING btree ("subject");--> statement-breakpoint
CREATE INDEX "account_session_expires_at_idx" ON "account_session" USING btree ("expires_at");