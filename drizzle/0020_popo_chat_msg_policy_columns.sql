ALTER TABLE "popo_chat_msg" ADD COLUMN "enabled" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "popo_chat_msg" ADD COLUMN "offset_minutes" integer;