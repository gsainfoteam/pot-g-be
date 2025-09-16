import { Module } from "@nestjs/common";
import { DatabaseModule } from "@src/database/database.module";
import { BankRepository } from "@src/accounting/repository/bank.repository";
import { AccountingService } from "@src/accounting/accounting.service";
import { UserBankRepository } from "@src/accounting/repository/user-bank.repository";
import { AccountingController } from "@src/accounting/accounting.controller";

@Module({
  imports: [DatabaseModule],
  providers: [
    AccountingService,
    AccountingController,
    BankRepository,
    UserBankRepository,
  ],
  controllers: [AccountingController],
})
export class AccountingModule {}
