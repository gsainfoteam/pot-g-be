import { Module } from "@nestjs/common";
import { DatabaseModule } from "@src/database/database.module";
import { AdminRouteService } from "@src/admin-route/admin-route.service";
import { AdminRouteController } from "@src/admin-route/admin-route.controller";

@Module({
  imports: [DatabaseModule],
  providers: [AdminRouteService],
  controllers: [AdminRouteController],
})
export class AdminRouteModule {}
