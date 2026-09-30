import { Module } from "@nestjs/common";
import { DatabaseModule } from "@src/database/database.module";
import { AdminAccountService } from "@src/admin-account/admin-account.service";
import { AdminAccountController } from "@src/admin-account/admin-account.controller";

@Module({
  imports: [DatabaseModule],
  providers: [AdminAccountService],
  controllers: [AdminAccountController],
})
export class AdminAccountModule {}
