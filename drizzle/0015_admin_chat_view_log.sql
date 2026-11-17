CREATE TABLE "admin_chat_view_log" (
	"pk" uuid PRIMARY KEY NOT NULL,
	"pot_room_fk" uuid NOT NULL,
	"admin_email" varchar(64) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "admin_chat_view_log" ADD CONSTRAINT "admin_chat_view_log_pot_room_fk_pot_room_pk_fk" FOREIGN KEY ("pot_room_fk") REFERENCES "public"."pot_room"("pk") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "admin_chat_view_log_pot_room_fk_idx" ON "admin_chat_view_log" USING btree ("pot_room_fk");