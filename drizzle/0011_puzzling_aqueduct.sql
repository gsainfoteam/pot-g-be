CREATE TABLE "report" (
	"pk" uuid PRIMARY KEY NOT NULL,
	"pot_room_fk" uuid NOT NULL,
	"user_fk" uuid NOT NULL,
	"target_user_fk" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"reason" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "report" ADD CONSTRAINT "report_pot_room_fk_pot_room_pk_fk" FOREIGN KEY ("pot_room_fk") REFERENCES "public"."pot_room"("pk") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report" ADD CONSTRAINT "report_user_fk_users_pk_fk" FOREIGN KEY ("user_fk") REFERENCES "public"."users"("pk") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report" ADD CONSTRAINT "report_target_user_fk_users_pk_fk" FOREIGN KEY ("target_user_fk") REFERENCES "public"."users"("pk") ON DELETE no action ON UPDATE no action;