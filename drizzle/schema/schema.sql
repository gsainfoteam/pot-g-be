CREATE TABLE "users"
(
    "pk"         uuid                     NOT NULL,
    "is_deleted" boolean                  NOT NULL,
    "name"       varchar(32)              NOT NULL,
    "created_at" timestamp with time zone NOT NULL,
    "updated_at" timestamp with time zone NOT NULL
);

CREATE TABLE "user_pot_room"
(
    "user_fk"     uuid NOT NULL,
    "pot_room_fk" uuid NOT NULL
);

CREATE TABLE "pot_room"
(
    "pk"         uuid                     NOT NULL,
    "route_fk"   uuid                     NOT NULL,
    "is_closed"  boolean                  NOT NULL,
    "is_deleted" boolean                  NOT NULL,
    "max_num"    smallint                 NOT NULL,
    "created_at" timestamp with time zone NOT NULL,
    "updated_at" timestamp with time zone NOT NULL,
    "name"       varchar(64)              NOT NULL
);

CREATE TYPE pot_event_type AS ENUM (
    'pot_create',
    'chat',
    'user_in',
    'user_out',
    'user_kick',
    'departure_confirm',
    'accounting_request',
    'accounting_confirm'
);

CREATE TABLE "pot_event"
(
    "timestamp" timestamp with time zone NOT NULL,
    "pot_fk"    uuid                     NOT NULL,
    "type"      pot_event_type           NOT NULL,
    "content"   jsonb                    NOT NULL
);

CREATE TABLE "user_alarm_setting"
(
    "pk"              uuid    NOT NULL,
    "device_fk"       uuid    NOT NULL,
    "any_push"        boolean NOT NULL,
    "chat_push"       boolean NOT NULL,
    "marketing_push"  boolean NOT NULL,
    "pot_in_out_push" boolean NOT NULL
);

CREATE TABLE "route"
(
    "pk"         uuid                     NOT NULL,
    "from_stop"  smallint                 NOT NULL,
    "to_stop"    smallint                 NOT NULL,
    "created_at" timestamp with time zone NOT NULL,
    "updated_at" timestamp with time zone NOT NULL
);

CREATE TABLE "device"
(
    "pk"         uuid                     NOT NULL,
    "user_fk"    uuid                     NOT NULL,
    "fcm_token"  varchar(64)              NOT NULL,
    "os"         varchar(4)               NOT NULL,
    "version"    varchar(8)               NOT NULL,
    "created_at" timestamp with time zone NOT NULL,
    "updated_at" timestamp with time zone NOT NULL
);

CREATE TABLE "bank"
(
    "pk"              uuid NOT NULL,
    "bank_short_name" varchar(64) NULL,
    "bank_full_name"  varchar(64) NULL,
    "logo"            text NULL
);

CREATE TABLE "user_bank"
(
    "user_fk" uuid NOT NULL,
    "bank_fk" uuid NOT NULL,
    "account" varchar(64) NULL
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
                                               "timestamp",
                                               "pot_fk"
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