ALTER TABLE "popo_chat_delivery" ADD COLUMN "progress" jsonb DEFAULT '{}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "popo_chat_delivery" ADD COLUMN "expires_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "popo_chat_delivery" ADD COLUMN "lease_token" uuid;--> statement-breakpoint
ALTER TABLE "popo_chat_delivery" ADD COLUMN "lease_until" timestamp with time zone;