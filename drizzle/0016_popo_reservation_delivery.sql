CREATE TABLE "popo_chat_delivery" (
	"pk" uuid PRIMARY KEY NOT NULL,
	"pot_fk" uuid NOT NULL,
	"events" jsonb NOT NULL,
	"user_pks" jsonb NOT NULL,
	"pot_name" text NOT NULL,
	"next_attempt_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "popo_chat_delivery" ADD CONSTRAINT "popo_chat_delivery_pot_fk_pot_room_pk_fk" FOREIGN KEY ("pot_fk") REFERENCES "public"."pot_room"("pk") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "popo_chat_delivery_next_attempt_at_index" ON "popo_chat_delivery" USING btree ("next_attempt_at");--> statement-breakpoint
CREATE INDEX "popo_chat_reservation_send_after_index" ON "popo_chat_reservation" USING btree ("send_after");