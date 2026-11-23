-- Rename existing tables and columns in place; preserve rows and v1 payloads.
ALTER TABLE "public"."popo_chat_delivery" RENAME TO "fofo_chat_delivery";
--> statement-breakpoint
ALTER TABLE "public"."popo_chat_msg" RENAME TO "fofo_chat_msg";
--> statement-breakpoint
ALTER TABLE "public"."popo_chat_reservation" RENAME TO "fofo_chat_reservation";
--> statement-breakpoint
ALTER TABLE "public"."fofo_chat_reservation" RENAME COLUMN "popo_chat_msg_type" TO "fofo_chat_msg_type";
--> statement-breakpoint
ALTER TABLE "public"."fofo_chat_delivery" RENAME CONSTRAINT "popo_chat_delivery_pkey" TO "fofo_chat_delivery_pkey";
--> statement-breakpoint
ALTER INDEX "public"."popo_chat_delivery_next_attempt_at_index" RENAME TO "fofo_chat_delivery_next_attempt_at_index";
--> statement-breakpoint
ALTER TABLE "public"."fofo_chat_delivery" RENAME CONSTRAINT "popo_chat_delivery_pot_fk_pot_room_pk_fk" TO "fofo_chat_delivery_pot_fk_pot_room_pk_fk";
--> statement-breakpoint
ALTER TABLE "public"."fofo_chat_msg" RENAME CONSTRAINT "popo_chat_msg_pkey" TO "fofo_chat_msg_pkey";
--> statement-breakpoint
ALTER TABLE "public"."fofo_chat_reservation" RENAME CONSTRAINT "popo_chat_reservation_pkey" TO "fofo_chat_reservation_pkey";
--> statement-breakpoint
ALTER INDEX "public"."popo_chat_reservation_send_after_index" RENAME TO "fofo_chat_reservation_send_after_index";
--> statement-breakpoint
ALTER INDEX "public"."popo_chat_reservation_pot_fk_index" RENAME TO "fofo_chat_reservation_pot_fk_index";
--> statement-breakpoint
ALTER INDEX "public"."popo_chat_reservation_popo_chat_msg_type_index" RENAME TO "fofo_chat_reservation_fofo_chat_msg_type_index";
--> statement-breakpoint
ALTER INDEX "public"."popo_chat_reservation_pot_fk_popo_chat_msg_type_index" RENAME TO "fofo_chat_reservation_pot_fk_fofo_chat_msg_type_index";
--> statement-breakpoint
ALTER TABLE "public"."fofo_chat_reservation" RENAME CONSTRAINT "popo_chat_reservation_pot_fk_pot_room_pk_fk" TO "fofo_chat_reservation_pot_fk_pot_room_pk_fk";
--> statement-breakpoint
ALTER TABLE "public"."fofo_chat_reservation" RENAME CONSTRAINT "popo_chat_reservation_popo_chat_msg_type_popo_chat_msg_type_fk" TO "fofo_chat_reservation_fofo_chat_msg_type_fofo_chat_msg_type_fk";
