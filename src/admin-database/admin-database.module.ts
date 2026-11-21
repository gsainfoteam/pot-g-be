import { Module } from "@nestjs/common";
import { DatabaseModule } from "@src/database/database.module";
import { AdminAccountRepository } from "@src/admin-database/repository/admin-account.repository";
import { PotRoomAdminRepository } from "@src/admin-database/repository/pot-room.admin.repository";
import { PotEventAdminRepository } from "@src/admin-database/repository/pot-event.admin.repository";
import { RouteAdminRepository } from "@src/admin-database/repository/route.admin.repository";
import { AdminUserRepository } from "@src/admin-database/repository/admin-user.repository";
import { AdminChatViewLogRepository } from "@src/admin-database/repository/admin-chat-view-log.admin.repository";
import { ReportAdminRepository } from "@src/admin-database/repository/report.admin.repository";
import { PopoChatMsgAdminRepository } from "@src/admin-database/repository/popo-chat-msg.admin.repository";

/**
 * 어드민 전용 레포지토리만 모아서 export 하는 모듈입니다.
 * 어드민 쪽 모듈은 DatabaseModule 대신(또는 함께) 이 모듈을 import 합니다.
 */
@Module({
  imports: [DatabaseModule],
  providers: [
    AdminAccountRepository,
    PotRoomAdminRepository,
    PotEventAdminRepository,
    RouteAdminRepository,
    AdminUserRepository,
    ReportAdminRepository,
    AdminChatViewLogRepository,
    PopoChatMsgAdminRepository,
  ],
  exports: [
    AdminAccountRepository,
    PotRoomAdminRepository,
    PotEventAdminRepository,
    RouteAdminRepository,
    AdminUserRepository,
    ReportAdminRepository,
    AdminChatViewLogRepository,
    PopoChatMsgAdminRepository,
  ],
})
export class AdminDatabaseModule {}
