import { forwardRef, Module } from "@nestjs/common";
import { DatabaseModule } from "@src/database/database.module";
import { BroadcastingModule } from "@src/broadcasting/broadcasting.module";
import { PotModule } from "@src/pot/pot.module";
import { PopoService } from "@src/popo/popo.service";
import { PopoSchedulerService } from "@src/popo/popo.scheduler.service";

@Module({
  imports: [
    DatabaseModule,
    forwardRef(() => BroadcastingModule),
    forwardRef(() => PotModule),
  ],
  providers: [PopoService, PopoSchedulerService],
  exports: [PopoService],
})
export class PopoModule {}
