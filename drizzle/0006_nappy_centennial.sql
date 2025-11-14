ALTER TABLE "pot_room" DROP CONSTRAINT "FK_route_TO_pot_room_1";
--> statement-breakpoint
ALTER TABLE "pot_room" ADD CONSTRAINT "pot_room_route_fk_route_pk_fk" FOREIGN KEY ("route_fk") REFERENCES "public"."route"("pk") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "route" DROP CONSTRAINT "FK_stops_TO_route_from";
--> statement-breakpoint
ALTER TABLE "route" DROP CONSTRAINT "FK_stops_TO_route_to";
--> statement-breakpoint
ALTER TABLE "route" ADD CONSTRAINT "route_from_stop_fk_stops_pk_fk" FOREIGN KEY ("from_stop_fk") REFERENCES "public"."stops"("pk") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "route" ADD CONSTRAINT "route_to_stop_fk_stops_pk_fk" FOREIGN KEY ("to_stop_fk") REFERENCES "public"."stops"("pk") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_alarm_setting" DROP CONSTRAINT "FK_device_TO_user_alarm_setting_1";
--> statement-breakpoint
ALTER TABLE "user_alarm_setting" ADD CONSTRAINT "user_alarm_setting_device_fk_device_pk_fk" FOREIGN KEY ("device_fk") REFERENCES "public"."device"("pk") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "popo_chat_reservation" DROP CONSTRAINT "FK_popo_chat_msg_type_TO_popo_chat_reservation_1";
--> statement-breakpoint
ALTER TABLE "popo_chat_reservation" DROP CONSTRAINT "FK_pot_room_TO_popo_chat_reservation_1";
--> statement-breakpoint
ALTER TABLE "popo_chat_reservation" ADD CONSTRAINT "popo_chat_reservation_pot_fk_pot_room_pk_fk" FOREIGN KEY ("pot_fk") REFERENCES "public"."pot_room"("pk") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "popo_chat_reservation" ADD CONSTRAINT "popo_chat_reservation_popo_chat_msg_type_popo_chat_msg_type_fk" FOREIGN KEY ("popo_chat_msg_type") REFERENCES "public"."popo_chat_msg"("type") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "device" DROP CONSTRAINT "FK_users_TO_device_1";
--> statement-breakpoint
ALTER TABLE "device" ADD CONSTRAINT "device_user_fk_users_pk_fk" FOREIGN KEY ("user_fk") REFERENCES "public"."users"("pk") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_bank" DROP CONSTRAINT "FK_users_TO_user_bank_1";
--> statement-breakpoint
ALTER TABLE "user_bank" DROP CONSTRAINT "FK_bank_TO_user_bank_1";
--> statement-breakpoint
ALTER TABLE "user_bank" ADD CONSTRAINT "user_bank_user_fk_users_pk_fk" FOREIGN KEY ("user_fk") REFERENCES "public"."users"("pk") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_bank" ADD CONSTRAINT "user_bank_bank_fk_bank_pk_fk" FOREIGN KEY ("bank_fk") REFERENCES "public"."bank"("pk") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_pot_room" DROP CONSTRAINT "FK_users_TO_user_pot_room_1";
--> statement-breakpoint
ALTER TABLE "user_pot_room" DROP CONSTRAINT "FK_pot_room_TO_user_pot_room_1";
--> statement-breakpoint
ALTER TABLE "user_pot_room" ADD CONSTRAINT "user_pot_room_pot_room_fk_pot_room_pk_fk" FOREIGN KEY ("pot_room_fk") REFERENCES "public"."pot_room"("pk") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_pot_room" ADD CONSTRAINT "user_pot_room_user_fk_users_pk_fk" FOREIGN KEY ("user_fk") REFERENCES "public"."users"("pk") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_consent" DROP CONSTRAINT "FK_users_TO_user_consent_1";
--> statement-breakpoint
ALTER TABLE "user_consent" ADD CONSTRAINT "user_consent_user_fk_users_pk_fk" FOREIGN KEY ("user_fk") REFERENCES "public"."users"("pk") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
DROP INDEX "idx_popo_chat_reservation_pot_fk_popo_chat_msg_type";--> statement-breakpoint
CREATE INDEX "idx_popo_chat_reservation_pot_fk_popo_chat_msg_type" ON "popo_chat_reservation" USING btree ("pot_fk","popo_chat_msg_type");--> statement-breakpoint
DROP INDEX "idx_pot_event_n_pot_fk_type";--> statement-breakpoint
CREATE INDEX "idx_pot_event_n_pot_fk_type" ON "pot_event" USING btree ("pot_fk","type");--> statement-breakpoint
ALTER TABLE "bank" ALTER COLUMN "logo" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "device" ALTER COLUMN "logged_in" SET DEFAULT false;--> statement-breakpoint
ALTER TABLE "stops" ALTER COLUMN "lat" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "stops" ALTER COLUMN "lng" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "pot_event" ADD CONSTRAINT "pot_event_pot_fk_pot_room_pk_fk" FOREIGN KEY ("pot_fk") REFERENCES "public"."pot_room"("pk") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
