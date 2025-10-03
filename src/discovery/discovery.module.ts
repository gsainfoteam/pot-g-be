import { Module } from "@nestjs/common";
import { DatabaseModule } from "@src/database/database.module";
import { PotGDiscoveryService } from "@src/discovery/discovery.service";
import { RouteService } from "@src/discovery/route.service";
import { DiscoveryController } from "@src/discovery/discovery.controller";

@Module({
  imports: [DatabaseModule],
  providers: [PotGDiscoveryService, RouteService, DiscoveryController],
  exports: [RouteService],
  controllers: [DiscoveryController],
})
export class DiscoveryModule {}
