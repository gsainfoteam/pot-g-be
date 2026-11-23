import { forwardRef, Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AdminDatabaseModule } from "@src/admin-database/admin-database.module";
import { DatabaseModule } from "@src/database/database.module";
import { DiscoveryModule } from "@src/discovery/discovery.module";
import { BroadcastingModule } from "@src/broadcasting/broadcasting.module";
import { PotModule } from "@src/pot/pot.module";
import { FofoService } from "@src/fofo/fofo.service";
import { FofoSchedulerService } from "@src/fofo/fofo.scheduler.service";
import { DelayCheckService } from "@src/fofo/delay-check.service";

@Module({
  imports: [
    ConfigModule,
    AdminDatabaseModule,
    DatabaseModule,
    DiscoveryModule,
    forwardRef(() => BroadcastingModule),
    forwardRef(() => PotModule),
  ],
  providers: [FofoService, FofoSchedulerService, DelayCheckService],
  exports: [FofoService, DelayCheckService],
})
export class FofoModule {}
