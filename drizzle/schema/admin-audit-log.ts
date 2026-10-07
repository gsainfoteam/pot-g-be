import {
  index,
  jsonb,
  pgEnum,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { adminAccount } from "./admin-account";

/*
CREATE TYPE "admin_audit_log_action" AS ENUM (
    'login',
    'logout',
    'admin_create',
    'admin_delete',
    'admin_role_update',
    'route_hide',
    'route_unhide',
    'app_version_update'
);
CREATE TYPE "admin_audit_log_target_type" AS ENUM ('admin_account', 'route', 'app_version');
CREATE TYPE "admin_audit_log_result" AS ENUM ('success', 'failure');

CREATE TABLE "admin_audit_log" (
    "pk"          uuid                        NOT NULL,
    "admin_fk"    uuid                        NOT NULL,
    "action"      admin_audit_log_action      NOT NULL,
    "target_type" admin_audit_log_target_type NULL,
    "target_id"   varchar(64)                 NULL,
    "before"      jsonb                       NULL,
    "after"       jsonb                       NULL,
    "result"      admin_audit_log_result      NOT NULL,
    "request_id"  varchar(64)                 NOT NULL,
    "ip"          varchar(45)                 NULL,
    "created_at"  timestamp with time zone    NOT NULL DEFAULT NOW(),
    PRIMARY KEY ("pk")
);
CREATE INDEX "idx_admin_audit_log_n_admin_fk_created_at" ON "admin_audit_log" ("admin_fk", "created_at");
CREATE INDEX "idx_admin_audit_log_n_target" ON "admin_audit_log" ("target_type", "target_id", "created_at");
CREATE INDEX "idx_admin_audit_log_n_request_id" ON "admin_audit_log" ("request_id");

@note: pk 는 UUIDv7 (uuid 패키지의 v7()) 로 생성합니다. 시간순 정렬이 되므로 order by pk 로 최신순 조회가 가능하며, 그래서 created_at 단독 인덱스는 두지 않습니다.
@note: audit log 는 append-only 입니다. 수정/삭제하지 않으므로 updated_at 이 없습니다.
@note: admin 이 삭제되어도 기록은 남아야 하므로 admin_fk 에 cascade 를 두지 않습니다.
@note: target_type, target_id 는 login/logout 처럼 대상이 없는 action 을 위해 nullable 입니다.
@note: target_id 는 대상 테이블마다 pk 타입이 달라 varchar 로 저장하며, 그래서 fk 를 걸지 않습니다.
@note: before/after 는 변경된 필드만 담은 스냅샷입니다. (예: {"isDeleted": false} -> {"isDeleted": true})
@note: result 는 해당 요청의 성공/실패 여부입니다. 실패한 시도도 기록합니다.
@note: request_id 는 하나의 http 요청에서 발생한 로그들을 묶기 위한 값입니다.
@note: action, target_type 의 추가는 반드시 맨 아래에 추가 되어야 합니다.
*/
export const adminAuditLogAction = pgEnum("admin_audit_log_action", [
  "login",
  "logout",
  "admin_create",
  "admin_delete",
  "admin_role_update",
  "route_hide",
  "route_unhide",
  "app_version_update",
]);

export const adminAuditLogTargetType = pgEnum("admin_audit_log_target_type", [
  "admin_account",
  "route",
  "app_version",
]);

export const adminAuditLogResult = pgEnum("admin_audit_log_result", [
  "success",
  "failure",
]);

export const adminAuditLog = pgTable(
  "admin_audit_log",
  {
    pk: uuid("pk").primaryKey().notNull(),
    adminFk: uuid("admin_fk")
      .notNull()
      .references(() => adminAccount.pk),
    action: adminAuditLogAction("action").notNull(),
    targetType: adminAuditLogTargetType("target_type"),
    targetId: varchar("target_id", { length: 64 }),
    before: jsonb("before"),
    after: jsonb("after"),
    result: adminAuditLogResult("result").notNull(),
    requestId: varchar("request_id", { length: 64 }).notNull(),
    ip: varchar("ip", { length: 45 }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index().on(table.adminFk, table.createdAt),
    index().on(table.targetType, table.targetId, table.createdAt),
    index().on(table.requestId),
  ],
);

export const adminAuditLogRelations = relations(adminAuditLog, ({ one }) => ({
  admin: one(adminAccount, {
    fields: [adminAuditLog.adminFk],
    references: [adminAccount.pk],
  }),
}));
