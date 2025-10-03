import { Module } from "@nestjs/common";
import { DatabaseModule } from "@src/database/database.module";
import { AccountingService } from "@src/accounting/accounting.service";
import { AccountingController } from "@src/accounting/accounting.controller";

@Module({
  imports: [DatabaseModule],
  providers: [AccountingService, AccountingController],
  controllers: [AccountingController],
})
export class AccountingModule {}
