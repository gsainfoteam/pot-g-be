import { Module } from "@nestjs/common";
import { ConfigModule } from "../config/config.module";
import { DatabaseModule } from "../database/database.module";
import { PotController } from "@src/pot/pot.controller";
import { PotService } from "@src/pot/pot.service";
import { PotEventRepository } from "@src/pot/repository/pot-event.repository";
import { PotRoomRepository } from "@src/pot/repository/pot-room.repository";
import { UserPotRoomRepository } from "@src/pot/repository/user-pot-room.repository";
import { DiscoveryModule } from "@src/discovery/discovery.module";

@Module({
  imports: [ConfigModule, DatabaseModule, DiscoveryModule],
  providers: [
    PotService,
    PotEventRepository,
    PotRoomRepository,
    UserPotRoomRepository,
  ],
  controllers: [PotController],
})
export class PotModule {}
