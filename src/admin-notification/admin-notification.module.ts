import { Module } from "@nestjs/common";
import { AdminDatabaseModule } from
  "@src/admin-database/admin-database.module";
import { AdminNotificationController } from
  "./admin-notification.controller";
import { AdminNotificationService } from
  "./admin-notification.service";

@Module({
  imports: [AdminDatabaseModule],
  controllers: [AdminNotificationController],
  providers: [AdminNotificationService],
})
export class AdminNotificationModule {}