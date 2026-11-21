import { forwardRef, Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AdminDatabaseModule } from "@src/admin-database/admin-database.module";
import { DatabaseModule } from "@src/database/database.module";
import { DiscoveryModule } from "@src/discovery/discovery.module";
import { BroadcastingModule } from "@src/broadcasting/broadcasting.module";
import { PotModule } from "@src/pot/pot.module";
import { PopoService } from "@src/popo/popo.service";
import { PopoSchedulerService } from "@src/popo/popo.scheduler.service";
import { DelayCheckService } from "@src/popo/delay-check.service";

@Module({
  imports: [
    ConfigModule,
    AdminDatabaseModule,
    DatabaseModule,
    DiscoveryModule,
    forwardRef(() => BroadcastingModule),
    forwardRef(() => PotModule),
  ],
  providers: [PopoService, PopoSchedulerService, DelayCheckService],
  exports: [PopoService, DelayCheckService],
})
export class PopoModule {}
