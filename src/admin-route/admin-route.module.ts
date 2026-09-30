import { Module } from "@nestjs/common";
import { DatabaseModule } from "@src/database/database.module";
import { DiscoveryModule } from "@src/discovery/discovery.module";
import { AdminRouteService } from "@src/admin-route/admin-route.service";
import { AdminRouteController } from "@src/admin-route/admin-route.controller";

@Module({
  imports: [DatabaseModule, DiscoveryModule],
  providers: [AdminRouteService],
  controllers: [AdminRouteController],
})
export class AdminRouteModule {}
