import { forwardRef, Module } from "@nestjs/common";
import { DatabaseModule } from "@src/database/database.module";
import { BroadcastingModule } from "@src/broadcasting/broadcasting.module";
import { PotModule } from "@src/pot/pot.module";

@Module({
  imports: [DatabaseModule, BroadcastingModule, forwardRef(() => PotModule)],
  providers: [],
  exports: [],
})
export class PopoModule {}
