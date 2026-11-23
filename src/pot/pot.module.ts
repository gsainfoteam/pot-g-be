import { forwardRef, Module } from "@nestjs/common";
import { ConfigModule } from "../config/config.module";
import { DatabaseModule } from "../database/database.module";
import { PotController } from "@src/pot/pot.controller";
import { PotService } from "@src/pot/pot.service";
import { DiscoveryModule } from "@src/discovery/discovery.module";
import { BroadcastingModule } from "@src/broadcasting/broadcasting.module";
import { FofoModule } from "@src/fofo/fofo.module";

@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    DiscoveryModule,
    forwardRef(() => BroadcastingModule),
    FofoModule,
  ],
  providers: [PotService],
  controllers: [PotController],
  exports: [PotService],
})
export class PotModule {}
