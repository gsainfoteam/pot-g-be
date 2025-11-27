ALTER TABLE "refresh_token" ALTER COLUMN "expires_at" DROP DEFAULT;--> statement-breakpoint
CREATE INDEX "refresh_token_expires_at_index" ON "refresh_token" USING btree ("expires_at");