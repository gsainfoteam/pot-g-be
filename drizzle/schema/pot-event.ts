import {
  index,
  jsonb,
  pgEnum,
  pgSequence,
  pgTable,
  primaryKey,
  smallint,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";
import { potRoom } from "./pot-room";

// potEventType 의 추가는 반드시 맨 아래에 추가 되어야 합니다.
export const potEventType = pgEnum("pot_event_type", [
  "create_v1",
  "chat_v1",
  "popo_chat_v1",
  "user_in_v1",
  "user_leave_v1",
  "user_kick_v1",
  "departure_confirm_v1",
  "accounting_request_v1",
  "accounting_confirm_v1",
  "archive_v1",
]);

/*
CREATE SEQUENCE "pot_event_id"
  START WITH 0
  MINVALUE 0
  MAXVALUE 10000
  CYCLE
  CACHE 1;
 */
export const potEventIdSequence = pgSequence("pot_event_id", {
  startWith: 0,
  maxValue: 10000,
  minValue: 0,
  cycle: true,
  cache: 1,
});

export type PotEventStringType = (typeof potEventType.enumValues)[number];

/*
CREATE TABLE "pot_event" (
    "pot_fk"        uuid                     NOT NULL,
    "timestamp"     timestamp with time zone NOT NULL,
    "id"            smallint                 NOT NULL DEFAULT nextval('pot_event_id'),
    "type"          pot_event_type           NOT NULL,
    "data"          jsonb                    NOT NULL,
    PRIMARY KEY ("pot_fk", "timestamp", "id")
);
CREATE INDEX "idx_pot_event_pot_fk_type" ON "pot_event" ("pot_fk", "type");

@note: 의도적으로 pot fk 를 timestamp 의 앞에 위치 시켰습니다. pot event 의 pk 를 통해 조회 후 order by timestamp 시 성능상 이점을 가져올 수 있습니다.
@note: Pot Fk 와 Type 순서로 인덱스를 추가 했습니다. Pot Fk 를 통해 pot event 를 조회할 때, type 으로 필터링 할 수 있도록 하기 위함 입니다.
*/
export const potEvent = pgTable(
  "pot_event",
  {
    potFk: uuid("pot_fk").notNull(),
    timestamp: timestamp("timestamp", { withTimezone: true }).notNull(),
    id: smallint("id")
      .default(sql`nextval('pot_event_id')`)
      .notNull(),
    type: potEventType("type").notNull(),
    data: jsonb("data").notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.potFk, table.timestamp, table.id] }),
    index("idx_pot_event_pot_fk_type").on(table.potFk, table.type),
  ],
);

export const potEventRelations = relations(potEvent, ({ one }) => ({
  potRoom: one(potRoom, {
    fields: [potEvent.potFk],
    references: [potRoom.pk],
  }),
}));
