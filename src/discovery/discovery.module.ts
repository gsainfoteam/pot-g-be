import { Module } from "@nestjs/common";
import { DatabaseModule } from "@src/database/database.module";
import { PotGDiscoveryService } from "@src/discovery/discovery.service";
import { RouteService } from "@src/discovery/route.service";
import { RouteRepository } from "@src/discovery/repository/route.repository";
import { StopsRepository } from "@src/discovery/repository/stops.repository";
import { DiscoveryController } from "@src/discovery/discovery.controller";
import { PotRoomRepository } from "@src/discovery/repository/pot-room.repository";

@Module({
  imports: [DatabaseModule],
  providers: [
    PotGDiscoveryService,
    RouteService,
    RouteRepository,
    StopsRepository,
    PotRoomRepository,
    DiscoveryController,
  ],
  exports: [RouteService],
  controllers: [DiscoveryController],
})
export class DiscoveryModule {}
