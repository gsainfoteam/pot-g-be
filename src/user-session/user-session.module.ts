import { Module } from "@nestjs/common";
import { DatabaseModule } from "@src/database/database.module";
import { UserSessionService } from "@src/user-session/user-session.service";

@Module({
  imports: [DatabaseModule],
  providers: [UserSessionService],
  exports: [UserSessionService],
})
export class UserSessionModule {}
