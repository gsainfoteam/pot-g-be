DROP INDEX "idx_popo_chat_reservation_pot_fk_popo_chat_msg_type";--> statement-breakpoint
DROP INDEX "idx_pot_event_n_pot_fk_type";--> statement-breakpoint
ALTER TABLE "user_bank" DROP CONSTRAINT "PK_USER_BANK";--> statement-breakpoint
ALTER TABLE "user_consent" DROP CONSTRAINT "PK_USER_CONSENT";--> statement-breakpoint
ALTER TABLE "user_pot_room" DROP CONSTRAINT "PK_USER_POT_ROOM";--> statement-breakpoint
ALTER TABLE "route" ALTER COLUMN "short_name_kor" SET DATA TYPE varchar(64);--> statement-breakpoint
ALTER TABLE "route" ALTER COLUMN "short_name_eng" SET DATA TYPE varchar(64);--> statement-breakpoint
ALTER TABLE "user_bank" ADD CONSTRAINT "user_bank_user_fk_bank_fk_pk" PRIMARY KEY("user_fk","bank_fk");--> statement-breakpoint
ALTER TABLE "user_consent" ADD CONSTRAINT "user_consent_user_fk_term_pk" PRIMARY KEY("user_fk","term");--> statement-breakpoint
ALTER TABLE "user_pot_room" ADD CONSTRAINT "user_pot_room_pot_room_fk_user_fk_pk" PRIMARY KEY("pot_room_fk","user_fk");--> statement-breakpoint
CREATE INDEX "device_user_fk_index" ON "device" USING btree ("user_fk");--> statement-breakpoint
CREATE INDEX "popo_chat_reservation_pot_fk_index" ON "popo_chat_reservation" USING btree ("pot_fk");--> statement-breakpoint
CREATE INDEX "popo_chat_reservation_popo_chat_msg_type_index" ON "popo_chat_reservation" USING btree ("popo_chat_msg_type");--> statement-breakpoint
CREATE INDEX "popo_chat_reservation_pot_fk_popo_chat_msg_type_index" ON "popo_chat_reservation" USING btree ("pot_fk","popo_chat_msg_type");--> statement-breakpoint
CREATE INDEX "pot_event_pot_fk_index" ON "pot_event" USING btree ("pot_fk");--> statement-breakpoint
CREATE INDEX "pot_event_pot_fk_type_index" ON "pot_event" USING btree ("pot_fk","type");--> statement-breakpoint
CREATE INDEX "pot_room_route_fk_index" ON "pot_room" USING btree ("route_fk");--> statement-breakpoint
CREATE INDEX "route_from_stop_fk_index" ON "route" USING btree ("from_stop_fk");--> statement-breakpoint
CREATE INDEX "route_to_stop_fk_index" ON "route" USING btree ("to_stop_fk");--> statement-breakpoint
CREATE INDEX "user_alarm_setting_device_fk_index" ON "user_alarm_setting" USING btree ("device_fk");--> statement-breakpoint
CREATE INDEX "user_bank_user_fk_index" ON "user_bank" USING btree ("user_fk");--> statement-breakpoint
CREATE INDEX "user_bank_bank_fk_index" ON "user_bank" USING btree ("bank_fk");--> statement-breakpoint
CREATE INDEX "user_consent_user_fk_index" ON "user_consent" USING btree ("user_fk");--> statement-breakpoint
CREATE INDEX "user_pot_room_pot_room_fk_index" ON "user_pot_room" USING btree ("pot_room_fk");--> statement-breakpoint
CREATE INDEX "user_pot_room_user_fk_index" ON "user_pot_room" USING btree ("user_fk");