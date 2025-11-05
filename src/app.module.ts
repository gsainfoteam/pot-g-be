import { Module } from "@nestjs/common";
import { DatabaseModule } from "./database/database.module";
import { ConfigModule } from "./config/config.module";
import { UserModule } from "@src/user/user.module";
import { AuthModule } from "@src/auth/auth.module";
import { KeyPairModule } from "@src/keypair/key-pair.module";
import { DiscoveryModule } from "@src/discovery/discovery.module";
import { AccountingModule } from "@src/accounting/accounting.module";
import { PotModule } from "@src/pot/pot.module";
import { WebsocketModule } from "@src/websocket/websocket.module";
import { ScheduleModule } from "@nestjs/schedule";
import { FcmModule } from "@src/fcm/fcm.module";
import { AppVersionModule } from "@src/app-version/app-version.module";
import { LoggerModule } from "@src/global/logger/logger.module";
import { SlackModule } from "nestjs-slack";
import { ConfigService } from "@nestjs/config";

@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    UserModule,
    AuthModule,
    // RedisModule,
    KeyPairModule,
    DiscoveryModule,
    AccountingModule,
    PotModule,
    WebsocketModule,
    ScheduleModule.forRoot(),
    FcmModule,
    AppVersionModule,
    LoggerModule,
    SlackModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: "webhook",
        url: configService.get<string>("SLACK_WEBHOOK_URL"),
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
