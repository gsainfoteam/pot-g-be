import { Module } from "@nestjs/common";
import { DatabaseModule } from "@src/database/database.module";
import { AdminDatabaseModule } from "@src/admin-database/admin-database.module";
import { AdminPotService } from "@src/admin-pot/admin-pot.service";
import { AdminPotController } from "@src/admin-pot/admin-pot.controller";

@Module({
  imports: [DatabaseModule, AdminDatabaseModule],
  providers: [AdminPotService],
  controllers: [AdminPotController],
})
export class AdminPotModule {}
