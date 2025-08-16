import { Module } from "@nestjs/common";
import { UserController } from "@src/user/user.controller";
import { UserService } from "@src/user/user.service";
import { InfoteamIdpModule } from "@lib/infoteam-idp";
import { DatabaseModule } from "@src/database/database.module";
import { AuthModule } from "@src/auth/auth.module";
import { UserRepository } from "@src/user/repository/user.repository";
import { UserAlarmSettingRepository } from "@src/user/repository/user-alarm-setting.repository";
import { DeviceRepository } from "@src/user/repository/device.repository";

@Module({
  imports: [InfoteamIdpModule, DatabaseModule, AuthModule],
  providers: [
    UserController,
    UserService,
    UserRepository,
    UserAlarmSettingRepository,
    DeviceRepository,
  ],
  exports: [],
  controllers: [UserController],
})
export class UserModule {}
