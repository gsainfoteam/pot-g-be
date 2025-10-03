import { Module } from "@nestjs/common";
import { ConfigModule } from "../config/config.module";
import { DatabaseModule } from "../database/database.module";
import { PotController } from "@src/pot/pot.controller";
import { PotService } from "@src/pot/pot.service";
import { DiscoveryModule } from "@src/discovery/discovery.module";
import { BroadcastingModule } from "@src/broadcasting/broadcasting.module";

@Module({
  imports: [ConfigModule, DatabaseModule, DiscoveryModule, BroadcastingModule],
  providers: [PotService],
  controllers: [PotController],
  exports: [PotService],
})
export class PotModule {}
