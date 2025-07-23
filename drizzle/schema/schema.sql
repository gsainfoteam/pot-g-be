CREATE TABLE "users"
(
    "pk"         uuid                     NOT NULL,
    "is_deleted" boolean                  NOT NULL,
    "idp_sub"    varchar(64)              NOT NULL,
    "name"       varchar(32)              NOT NULL,
    "email"      varchar(64)              NOT NULL,
    "student_id" varchar(16)              NOT NULL,
    "created_at" timestamp with time zone NOT NULL DEFAULT NOW(),
    "updated_at" timestamp with time zone NOT NULL DEFAULT NOW()
);

CREATE TABLE "user_pot_room"
(
    "user_fk"     uuid    NOT NULL,
    "pot_room_fk" uuid    NOT NULL,
    "is_host"     boolean NOT NULL DEFAULT FALSE
);

CREATE TABLE "pot_room"
(
    "pk"                     uuid                     NOT NULL,
    "route_fk"               uuid                     NOT NULL,
    "is_archived"            boolean                  NOT NULL DEFAULT FALSE,
    "is_deleted"             boolean                  NOT NULL DEFAULT FALSE,
    "is_departure_confirmed" boolean                  NOT NULL DEFAULT FALSE,
    "max_capacity"           smallint                 NOT NULL,
    "starts_at"              timestamp with time zone NOT NULL,
    "ends_at"                timestamp with time zone NOT NULL,
    "created_at"             timestamp with time zone NOT NULL DEFAULT NOW(),
    "updated_at"             timestamp with time zone NOT NULL DEFAULT NOW(),
    "name"                   varchar(64)              NOT NULL
);

CREATE TYPE "pot_event_type" AS ENUM (
    'create_v1',
    'chat_v1',
    'user_in_v1',
    'user_leave_v1',
    'user_kick_v1',
    'departure_confirm_v1',
    'accounting_request_v1',
    'accounting_confirm_v1',
    'archive_v1'
);

CREATE TABLE "pot_event"
(
    "pot_fk"    uuid                     NOT NULL,
    "timestamp" timestamp with time zone NOT NULL,
    "type"      pot_event_type           NOT NULL,
    "data"      jsonb                    NOT NULL
);

CREATE INDEX "idx_pot_event_pot_fk_type" ON "pot_event" ("pot_fk", "type");

CREATE TABLE "user_alarm_setting"
(
    "pk"              uuid    NOT NULL,
    "device_fk"       uuid    NOT NULL,
    "any_push"        boolean NOT NULL DEFAULT TRUE,
    "chat_push"       boolean NOT NULL DEFAULT TRUE,
    "marketing_push"  boolean NOT NULL DEFAULT TRUE,
    "pot_in_out_push" boolean NOT NULL DEFAULT TRUE
);

CREATE TABLE "route"
(
    "pk"         uuid                     NOT NULL,
    "from_stop"  smallint                 NOT NULL,
    "to_stop"    smallint                 NOT NULL,
    "created_at" timestamp with time zone NOT NULL DEFAULT NOW(),
    "updated_at" timestamp with time zone NOT NULL DEFAULT NOW()
);

CREATE TABLE "device"
(
    "pk"         uuid                     NOT NULL,
    "user_fk"    uuid                     NOT NULL,
    "fcm_token"  varchar(64)              NOT NULL,
    "os"         varchar(4)               NOT NULL,
    "version"    varchar(8)               NOT NULL,
    "created_at" timestamp with time zone NOT NULL DEFAULT NOW(),
    "updated_at" timestamp with time zone NOT NULL DEFAULT NOW()
);

CREATE TABLE "bank"
(
    "pk"              uuid        NOT NULL,
    "bank_short_name" varchar(64) NOT NULL,
    "bank_full_name"  varchar(64) NOT NULL,
    "logo"            text        NOT NULL DEFAULT "https://png.pngtree.com/template/20190308/ourmid/pngtree-banking-logo-image_63077.jpg"
);

CREATE TABLE "user_bank"
(
    "user_fk" uuid        NOT NULL,
    "bank_fk" uuid        NOT NULL,
    "account" varchar(64) NOT NULL
);

ALTER TABLE "users"
    ADD CONSTRAINT "PK_USERS" PRIMARY KEY (
                                           "pk"
        );

ALTER TABLE "user_pot_room"
    ADD CONSTRAINT "PK_USER_POT_ROOM" PRIMARY KEY (
                                                   "user_fk",
                                                   "pot_room_fk"
        );

ALTER TABLE "pot_room"
    ADD CONSTRAINT "PK_POT_ROOM" PRIMARY KEY (
                                              "pk"
        );

ALTER TABLE "pot_event"
    ADD CONSTRAINT "PK_POT_EVENT" PRIMARY KEY (
                                               "pot_fk",
                                               "timestamp"
        );

ALTER TABLE "user_alarm_setting"
    ADD CONSTRAINT "PK_USER_ALARM_SETTING" PRIMARY KEY (
                                                        "pk"
        );

ALTER TABLE "route"
    ADD CONSTRAINT "PK_ROUTE" PRIMARY KEY (
                                           "pk"
        );

ALTER TABLE "device"
    ADD CONSTRAINT "PK_DEVICE" PRIMARY KEY (
                                            "pk"
        );

ALTER TABLE "bank"
    ADD CONSTRAINT "PK_BANK" PRIMARY KEY (
                                          "pk"
        );

ALTER TABLE "user_bank"
    ADD CONSTRAINT "PK_USER_BANK" PRIMARY KEY (
                                               "user_fk",
                                               "bank_fk"
        );

ALTER TABLE "user_pot_room"
    ADD CONSTRAINT "FK_users_TO_user_pot_room_1" FOREIGN KEY (
                                                              "user_fk"
        )
        REFERENCES "users" (
                            "pk"
            );

ALTER TABLE "user_pot_room"
    ADD CONSTRAINT "FK_pot_room_TO_user_pot_room_1" FOREIGN KEY (
                                                                 "pot_room_fk"
        )
        REFERENCES "pot_room" (
                               "pk"
            );

ALTER TABLE "pot_room"
    ADD CONSTRAINT "FK_route_TO_pot_room_1" FOREIGN KEY (
                                                         "route_fk"
        )
        REFERENCES "route" (
                            "pk"
            );

ALTER TABLE "pot_event"
    ADD CONSTRAINT "FK_pot_room_TO_pot_event_1" FOREIGN KEY (
                                                             "pot_fk"
        )
        REFERENCES "pot_room" (
                               "pk"
            );

ALTER TABLE "user_alarm_setting"
    ADD CONSTRAINT "FK_device_TO_user_alarm_setting_1" FOREIGN KEY (
                                                                    "device_fk"
        )
        REFERENCES "device" (
                             "pk"
            );

ALTER TABLE "device"
    ADD CONSTRAINT "FK_users_TO_device_1" FOREIGN KEY (
                                                       "user_fk"
        )
        REFERENCES "users" (
                            "pk"
            );

ALTER TABLE "user_bank"
    ADD CONSTRAINT "FK_users_TO_user_bank_1" FOREIGN KEY (
                                                          "user_fk"
        )
        REFERENCES "users" (
                            "pk"
            );

ALTER TABLE "user_bank"
    ADD CONSTRAINT "FK_bank_TO_user_bank_1" FOREIGN KEY (
                                                         "bank_fk"
        )
        REFERENCES "bank" (
                           "pk"
            );