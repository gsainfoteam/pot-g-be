import { Module } from "@nestjs/common";
import { HttpModule } from "@nestjs/axios";
import { UserAuthService } from "@src/auth/user-auth.service";
import { InfoteamIdpModule } from "@lib/infoteam-idp";
import { UserGuard } from "@src/auth/guard/user.guard";
import { UserJwtStrategy } from "@src/auth/strategy/user-jwt.strategy";
import { JwtModule } from "@nestjs/jwt";
import { DatabaseModule } from "@src/database/database.module";
import { AdminAccountRepository } from "@src/database/repository/admin-account.repository";
import { KeyPairService } from "@src/keypair/key-pair.service";
import { KeyPairModule } from "@src/keypair/key-pair.module";
import { ManagerJwtStrategy } from "@src/auth/strategy/manager-jwt.strategy";
import { RefreshTokenCleanupScheduler } from "@src/auth/scheduler/refresh-token-cleanup.scheduler";
import { ManagerAuthService } from "@src/auth/manager-auth.service";
import { ManagerAuthController } from "@src/auth/manager-auth.controller";

@Module({
  imports: [
    HttpModule.register({
      timeout: 1000,
      maxRedirects: 5,
    }),
    InfoteamIdpModule,
    JwtModule,
    DatabaseModule,
    KeyPairModule,
  ],
  controllers: [ManagerAuthController],
  providers: [
    UserAuthService,
    ManagerAuthService,
    UserGuard,
    {
      provide: UserJwtStrategy,
      useFactory: async (keyPairService: KeyPairService) => {
        return new UserJwtStrategy(
          (await keyPairService.getKeyPair()).publicKey,
        );
      },
      inject: [KeyPairService],
    },
    {
      provide: ManagerJwtStrategy,
      useFactory: async (
        keyPairService: KeyPairService,
        adminAccountRepository: AdminAccountRepository,
      ) => {
        return new ManagerJwtStrategy(
          (await keyPairService.getKeyPair()).publicKey,
          adminAccountRepository,
        );
      },
      inject: [KeyPairService, AdminAccountRepository],
    },
    RefreshTokenCleanupScheduler,
  ],
  exports: [UserAuthService, UserJwtStrategy, ManagerJwtStrategy],
})
export class AuthModule {}
