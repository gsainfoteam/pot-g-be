import { Module } from "@nestjs/common";
import { DatabaseModule } from "@src/database/database.module";
import { AdminPotService } from "@src/admin-pot/admin-pot.service";
import { AdminPotController } from "@src/admin-pot/admin-pot.controller";

@Module({
  imports: [DatabaseModule],
  providers: [AdminPotService],
  controllers: [AdminPotController],
})
export class AdminPotModule {}
