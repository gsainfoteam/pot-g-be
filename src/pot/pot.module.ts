import { Module } from "@nestjs/common";
import { ConfigModule } from "../config/config.module";
import { DatabaseModule } from "../database/database.module";
import { PotController } from "@src/pot/pot.controller";
import { PotService } from "@src/pot/pot.service";
import { PotEventRepository } from "@src/pot/repository/pot-event.repository";
import { DiscoveryModule } from "@src/discovery/discovery.module";
import { UserPotRoomRepository } from "@src/pot/repository/user-pot-room.repository";
import { PotRoomRepository } from "@src/discovery/repository/pot-room.repository";
import { BroadcastingModule } from "@src/broadcasting/broadcasting.module";

@Module({
  imports: [ConfigModule, DatabaseModule, DiscoveryModule, BroadcastingModule],
  providers: [
    PotService,
    PotEventRepository,
    UserPotRoomRepository,
    PotRoomRepository,
  ],
  controllers: [PotController],
  exports: [PotService],
})
export class PotModule {}
