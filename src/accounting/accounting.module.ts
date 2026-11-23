import { Module } from "@nestjs/common";
import { DatabaseModule } from "@src/database/database.module";
import { AccountingService } from "@src/accounting/accounting.service";
import { AccountingController } from "@src/accounting/accounting.controller";
import { PotModule } from "@src/pot/pot.module";
import { BroadcastingModule } from "@src/broadcasting/broadcasting.module";
import { FofoModule } from "@src/fofo/fofo.module";

@Module({
  imports: [DatabaseModule, PotModule, BroadcastingModule, FofoModule],
  providers: [AccountingService],
  controllers: [AccountingController],
})
export class AccountingModule {}
