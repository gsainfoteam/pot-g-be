import { Module } from "@nestjs/common";
import { DatabaseModule } from "@src/database/database.module";
import { AppVersionService } from "@src/app-version/app-version.service";
import { AppVersionController } from "@src/app-version/app-version.controller";

@Module({
  imports: [DatabaseModule],
  providers: [AppVersionService],
  controllers: [AppVersionController],
})
export class AppVersionModule {}
