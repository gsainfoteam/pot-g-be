import { Module } from "@nestjs/common";
import { DatabaseModule } from "@src/database/database.module";
import { AppVersionService } from "@src/app-version/app-version.service";
import { AppVersionController } from "@src/app-version/app-version.controller";
import { AppVersionManagerController } from "@src/app-version/app-version.manager.controller";

@Module({
  imports: [DatabaseModule],
  providers: [AppVersionService],
  controllers: [AppVersionController, AppVersionManagerController],
})
export class AppVersionModule {}
