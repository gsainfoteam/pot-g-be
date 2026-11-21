import { Module } from "@nestjs/common";
import { AdminDatabaseModule } from "@src/admin-database/admin-database.module";
import { DatabaseModule } from "@src/database/database.module";
import { PopoModule } from "@src/popo/popo.module";
import { AdminPopoMessageService } from "@src/admin-popo-message/admin-popo-message.service";
import { AdminPopoMessageController } from "@src/admin-popo-message/admin-popo-message.controller";
import { AdminPopoMessageStatusService } from "@src/admin-popo-message/admin-popo-message-status.service";
import { AdminPopoMessageStatusController } from "@src/admin-popo-message/admin-popo-message-status.controller";

@Module({
  imports: [DatabaseModule, AdminDatabaseModule, PopoModule],
  providers: [AdminPopoMessageService, AdminPopoMessageStatusService],
  controllers: [AdminPopoMessageController, AdminPopoMessageStatusController],
})
export class AdminPopoMessageModule {}
