-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE TYPE "public"."popo_action_btn_type" AS ENUM('departure-confirm-btn', 'taxi-call-btn', 'accounting-request-btn', 'accounting-info-check-btn', 'accounting-process-btn');--> statement-breakpoint
CREATE TYPE "public"."popo_chat_type" AS ENUM('popo-departure-confirm-request-v1', 'popo-departure-confirmed-v1', 'popo-reminder-taxi-call-v1', 'popo-accounting-reminder-v1', 'popo-accounting-request-v1', 'popo-auto-archive-no-departure-confirm-v1', 'popo-auto-archive-accounting-fin-v1', 'popo-auto-archive-v1');--> statement-breakpoint
CREATE TYPE "public"."pot_event_type" AS ENUM('create_v1', 'chat_v1', 'popo_chat_v1', 'user_in_v1', 'user_leave_v1', 'user_kick_v1', 'departure_confirm_v1', 'accounting_request_v1', 'accounting_confirm_v1', 'archive_v1');--> statement-breakpoint
CREATE SEQUENCE "public"."pot_event_id" INCREMENT BY 1 MINVALUE 0 MAXVALUE 10000 START WITH 0 CACHE 1 CYCLE;--> statement-breakpoint
CREATE TABLE "jwt_key_pair" (
	"pk" uuid PRIMARY KEY NOT NULL,
	"public_key" text NOT NULL,
	"private_key" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"pk" uuid PRIMARY KEY NOT NULL,
	"is_deleted" boolean NOT NULL,
	"idp_sub" varchar(64) NOT NULL,
	"name" varchar(32) NOT NULL,
	"email" varchar(64) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pot_room" (
	"pk" uuid PRIMARY KEY NOT NULL,
	"route_fk" uuid NOT NULL,
	"is_archived" boolean DEFAULT false NOT NULL,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"is_departure_confirmed" boolean DEFAULT false NOT NULL,
	"max_capacity" smallint NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"name" varchar(64) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "popo_chat_msg" (
	"type" "popo_chat_type" PRIMARY KEY NOT NULL,
	"action_btns" "popo_action_btn_type"[] NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"message" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "route" (
	"pk" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"from_stop_fk" uuid NOT NULL,
	"to_stop_fk" uuid NOT NULL,
	"short_name_kor" varchar(64) NOT NULL,
	"short_name_eng" varchar(64) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_alarm_setting" (
	"pk" uuid PRIMARY KEY NOT NULL,
	"device_fk" uuid NOT NULL,
	"any_push" boolean DEFAULT true NOT NULL,
	"chat_push" boolean DEFAULT true NOT NULL,
	"marketing_push" boolean DEFAULT true NOT NULL,
	"pot_in_out_push" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "popo_chat_reservation" (
	"pk" uuid PRIMARY KEY NOT NULL,
	"pot_fk" uuid NOT NULL,
	"popo_chat_msg_type" "popo_chat_type" NOT NULL,
	"send_after" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"format_arguments" jsonb
);
--> statement-breakpoint
CREATE TABLE "bank" (
	"pk" uuid PRIMARY KEY NOT NULL,
	"bank_short_name" varchar(64) NOT NULL,
	"bank_full_name" varchar(64) NOT NULL,
	"logo" text DEFAULT 'https://png.pngtree.com/template/20190308/ourmid/pngtree-banking-logo-image_63077.jpg' NOT NULL,
	"is_securities" boolean NOT NULL
);
--> statement-breakpoint
CREATE TABLE "device" (
	"pk" uuid PRIMARY KEY NOT NULL,
	"user_fk" uuid NOT NULL,
	"fcm_token" text NOT NULL,
	"os" varchar(4) NOT NULL,
	"version" varchar(8) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"device_id" varchar(64) NOT NULL,
	"logged_in" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "refresh_token" (
	"opaque_hash" text PRIMARY KEY NOT NULL,
	"refresh_token" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"user_pk" uuid
);
--> statement-breakpoint
CREATE TABLE "stops" (
	"pk" uuid PRIMARY KEY NOT NULL,
	"name_kor" varchar(127) NOT NULL,
	"name_eng" varchar(127) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"lat" double precision DEFAULT 0 NOT NULL,
	"lng" double precision DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "app_version" (
	"ios_min_version" varchar(32) NOT NULL,
	"ios_latest_version" varchar(32) NOT NULL,
	"aos_min_version" varchar(32) NOT NULL,
	"aos_latest_version" varchar(32) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_bank" (
	"user_fk" uuid NOT NULL,
	"bank_fk" uuid NOT NULL,
	"account" varchar(64) NOT NULL,
	CONSTRAINT "PK_USER_BANK" PRIMARY KEY("user_fk","bank_fk")
);
--> statement-breakpoint
CREATE TABLE "user_pot_room" (
	"pot_room_fk" uuid NOT NULL,
	"user_fk" uuid NOT NULL,
	"is_host" boolean DEFAULT false NOT NULL,
	"is_archived" boolean DEFAULT false NOT NULL,
	CONSTRAINT "PK_USER_POT_ROOM" PRIMARY KEY("pot_room_fk","user_fk")
);
--> statement-breakpoint
CREATE TABLE "user_consent" (
	"user_fk" uuid NOT NULL,
	"term" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "PK_USER_CONSENT" PRIMARY KEY("user_fk","term")
);
--> statement-breakpoint
CREATE TABLE "pot_event" (
	"pot_fk" uuid NOT NULL,
	"timestamp" timestamp with time zone NOT NULL,
	"id" smallint DEFAULT nextval('pot_event_id'::regclass) NOT NULL,
	"type" "pot_event_type" NOT NULL,
	"data" jsonb NOT NULL,
	CONSTRAINT "pot_event_pkey" PRIMARY KEY("pot_fk","timestamp","id")
);
--> statement-breakpoint
ALTER TABLE "pot_room" ADD CONSTRAINT "FK_route_TO_pot_room_1" FOREIGN KEY ("route_fk") REFERENCES "public"."route"("pk") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "route" ADD CONSTRAINT "FK_stops_TO_route_from" FOREIGN KEY ("from_stop_fk") REFERENCES "public"."stops"("pk") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "route" ADD CONSTRAINT "FK_stops_TO_route_to" FOREIGN KEY ("to_stop_fk") REFERENCES "public"."stops"("pk") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_alarm_setting" ADD CONSTRAINT "FK_device_TO_user_alarm_setting_1" FOREIGN KEY ("device_fk") REFERENCES "public"."device"("pk") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "popo_chat_reservation" ADD CONSTRAINT "FK_popo_chat_msg_type_TO_popo_chat_reservation_1" FOREIGN KEY ("popo_chat_msg_type") REFERENCES "public"."popo_chat_msg"("type") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "popo_chat_reservation" ADD CONSTRAINT "FK_pot_room_TO_popo_chat_reservation_1" FOREIGN KEY ("pot_fk") REFERENCES "public"."pot_room"("pk") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "device" ADD CONSTRAINT "FK_users_TO_device_1" FOREIGN KEY ("user_fk") REFERENCES "public"."users"("pk") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_bank" ADD CONSTRAINT "FK_users_TO_user_bank_1" FOREIGN KEY ("user_fk") REFERENCES "public"."users"("pk") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_bank" ADD CONSTRAINT "FK_bank_TO_user_bank_1" FOREIGN KEY ("bank_fk") REFERENCES "public"."bank"("pk") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_pot_room" ADD CONSTRAINT "FK_users_TO_user_pot_room_1" FOREIGN KEY ("user_fk") REFERENCES "public"."users"("pk") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_pot_room" ADD CONSTRAINT "FK_pot_room_TO_user_pot_room_1" FOREIGN KEY ("pot_room_fk") REFERENCES "public"."pot_room"("pk") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_consent" ADD CONSTRAINT "FK_users_TO_user_consent_1" FOREIGN KEY ("user_fk") REFERENCES "public"."users"("pk") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_popo_chat_reservation_pot_fk_popo_chat_msg_type" ON "popo_chat_reservation" USING btree ("pot_fk", "popo_chat_msg_type");--> statement-breakpoint
CREATE INDEX "refresh_token__index" ON "refresh_token" USING btree ("user_pk");--> statement-breakpoint
CREATE INDEX "idx_pot_event_n_pot_fk_type" ON "pot_event" USING btree ("pot_fk", "type");
