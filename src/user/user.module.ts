import { Module } from "@nestjs/common";
import { UserController } from "@src/user/user.controller";
import { UserService } from "@src/user/user.service";
import { InfoteamIdpModule } from "@lib/infoteam-idp";
import { DatabaseModule } from "@src/database/database.module";

@Module({
  imports: [InfoteamIdpModule, DatabaseModule],
  providers: [UserController, UserService],
  exports: [],
  controllers: [UserController],
})
export class UserModule {}
