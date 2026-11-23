import { Module } from "@nestjs/common";
import { AdminDatabaseModule } from "@src/admin-database/admin-database.module";
import { DatabaseModule } from "@src/database/database.module";
import { FofoModule } from "@src/fofo/fofo.module";
import { AdminFofoMessageService } from "@src/admin-fofo-message/admin-fofo-message.service";
import { AdminFofoMessageController } from "@src/admin-fofo-message/admin-fofo-message.controller";
import { AdminFofoMessageStatusService } from "@src/admin-fofo-message/admin-fofo-message-status.service";
import { AdminFofoMessageStatusController } from "@src/admin-fofo-message/admin-fofo-message-status.controller";

@Module({
  imports: [DatabaseModule, AdminDatabaseModule, FofoModule],
  providers: [AdminFofoMessageService, AdminFofoMessageStatusService],
  controllers: [AdminFofoMessageController, AdminFofoMessageStatusController],
})
export class AdminFofoMessageModule {}
