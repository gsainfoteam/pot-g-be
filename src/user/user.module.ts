import { Module } from "@nestjs/common";
import { UserController } from "@src/user/user.controller";
import { UserService } from "@src/user/user.service";
import { UserSessionModule } from "@src/user-session/user-session.module";
import { DatabaseModule } from "@src/database/database.module";
import { AuthModule } from "@src/auth/auth.module";
import { BroadcastingModule } from "@src/broadcasting/broadcasting.module";
import { PotModule } from "@src/pot/pot.module";

@Module({
  imports: [
    UserSessionModule,
    DatabaseModule,
    AuthModule,
    BroadcastingModule,
    PotModule,
  ],
  providers: [UserService],
  exports: [],
  controllers: [UserController],
})
export class UserModule {}
