import { Module } from "@nestjs/common";
import { DatabaseModule } from "@src/database/database.module";
import { AdminDashboardController } from "./admin-dashboard.controller";
import { AdminDashboardService } from "./admin-dashboard.service";
import { WebsocketModule } from "@src/websocket/websocket.module";
import { AdminDatabaseModule } from "@src/admin-database/admin-database.module";

@Module({
  imports: [DatabaseModule, AdminDatabaseModule, WebsocketModule],
  providers: [AdminDashboardService],
  controllers: [AdminDashboardController],
})
export class AdminDashboardModule {}
