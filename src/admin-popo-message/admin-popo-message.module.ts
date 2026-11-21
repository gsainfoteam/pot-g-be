import { Module } from "@nestjs/common";
import { AdminDatabaseModule } from "@src/admin-database/admin-database.module";
import { DatabaseModule } from "@src/database/database.module";
import { PopoModule } from "@src/popo/popo.module";
import { AdminPopoMessageService } from "@src/admin-popo-message/admin-popo-message.service";
import { AdminPopoMessageController } from "@src/admin-popo-message/admin-popo-message.controller";

@Module({
  imports: [DatabaseModule, AdminDatabaseModule, PopoModule],
  providers: [AdminPopoMessageService],
  controllers: [AdminPopoMessageController],
})
export class AdminPopoMessageModule {}
