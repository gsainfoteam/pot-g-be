import { Module } from "@nestjs/common";
import { join } from "node:path";
import { ServeStaticModule } from "@nestjs/serve-static";
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
import { AdminAccountModule } from "@src/admin-account/admin-account.module";
import { AdminRouteModule } from "@src/admin-route/admin-route.module";
import { AdminPotModule } from "@src/admin-pot/admin-pot.module";
import { SlackModule } from "nestjs-slack";
import { ConfigService } from "@nestjs/config";
import { ManagerAccountModule, UserAccountModule } from "@src/auth/account";
import { UserSessionModule } from "@src/user-session/user-session.module";
import { UserSessionService } from "@src/user-session/user-session.service";
import { AccountSessionRepository } from "@src/database/repository/account-session.repository";
import { ManagerAuthService } from "@src/auth/manager-auth.service";

@Module({
  imports: [
    ServeStaticModule.forRoot({
      // 빌드 결과물 기준 __dirname: dist/src -> ../../admin/dist
      rootPath: join(__dirname, "..", "..", "admin", "dist"),
      exclude: ["/api/{*any}"],
    }),
    ConfigModule,
    DatabaseModule,
    UserAccountModule.forRootAsync({
      isGlobal: true,
      imports: [DatabaseModule, UserSessionModule],
      inject: [ConfigService, AccountSessionRepository, UserSessionService],
      useFactory: (
        config: ConfigService,
        store: AccountSessionRepository,
        userSession: UserSessionService,
      ) => ({
        ...accountOptions(config),
        session: {
          secret: config.getOrThrow<string>("SESSION_SECRET"),
          store,
          // SDK 이전과 같은 access token 수명입니다. WebSocket 인증도 이 만료 시각을 따릅니다.
          accessTtl: 6 * 60 * 60,
          resolve: (user, { body }) => userSession.resolveSession(user, body),
        },
      }),
    }),
    ManagerAccountModule.forRootAsync({
      isGlobal: true,
      imports: [DatabaseModule, AuthModule],
      inject: [ConfigService, AccountSessionRepository, ManagerAuthService],
      useFactory: (
        config: ConfigService,
        store: AccountSessionRepository,
        managerAuth: ManagerAuthService,
      ) => ({
        ...accountOptions(config),
        session: {
          // 사용자 세션과 다른 키로 서명해야 사용자 access token 이 관리자 API 를 통과하지 못합니다.
          secret: `${config.getOrThrow<string>("SESSION_SECRET")}:manager`,
          store,
          // SDK 이전처럼 하루 동안 쓰지 않으면 다시 로그인합니다.
          refreshTtl: 24 * 60 * 60,
          resolve: (user) => managerAuth.resolveSession(user),
        },
      }),
    }),
    UserModule,
    AuthModule,
    KeyPairModule,
    DiscoveryModule,
    AccountingModule,
    PotModule,
    WebsocketModule,
    ScheduleModule.forRoot(),
    FcmModule,
    AppVersionModule,
    AdminAccountModule,
    AdminRouteModule,
    AdminPotModule,
    SlackModule.forRootAsync({
      imports: [ConfigModule],
      isGlobal: true,
      useFactory: (configService: ConfigService) => ({
        type: "webhook",
        channels: [
          {
            name: "bug",
            url: configService.get<string>("SLACK_WEBHOOK_URL"),
          },
          {
            name: "report",
            url: configService.get<string>("SLACK_REPORT_WEBHOOK_URL"),
          },
        ],
        defaultChannel: "bug",
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}

function accountOptions(config: ConfigService) {
  return {
    issuer: config.getOrThrow<string>("ACCOUNT_ISSUER"),
    clientId: config.getOrThrow<string>("IDP_CLIENT_ID"),
    clientSecret: config.getOrThrow<string>("IDP_CLIENT_SECRET"),
    // shortcut: 구 버전 앱이 client secret 없이 code 를 교환하므로 client 는 강제 업데이트 전까지 none 으로 남습니다. client_secret_post 로 바꾼 뒤 이 줄을 지웁니다.
    verifyRegistration: "warn" as const,
  };
}
