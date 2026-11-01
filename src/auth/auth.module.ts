import { Module } from "@nestjs/common";
import { UserAuthService } from "@src/auth/user-auth.service";
import { UserGuard } from "@src/auth/guard/user.guard";
import { UserJwtStrategy } from "@src/auth/strategy/user-jwt.strategy";
import { JwtModule } from "@nestjs/jwt";
import { DatabaseModule } from "@src/database/database.module";
import { AdminDatabaseModule } from "@src/admin-database/admin-database.module";
import { KeyPairService } from "@src/keypair/key-pair.service";
import { KeyPairModule } from "@src/keypair/key-pair.module";
import { ManagerSessionStrategy } from "@src/auth/strategy/manager-session.strategy";
import { UserSessionStrategy } from "@src/auth/strategy/user-session.strategy";
import { RefreshTokenCleanupScheduler } from "@src/auth/scheduler/refresh-token-cleanup.scheduler";
import { ManagerAuthService } from "@src/auth/manager-auth.service";
import { ManagerAuthController } from "@src/auth/manager-auth.controller";

@Module({
  imports: [JwtModule, DatabaseModule, AdminDatabaseModule, KeyPairModule],
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
    UserSessionStrategy,
    ManagerSessionStrategy,
    RefreshTokenCleanupScheduler,
  ],
  exports: [UserAuthService, ManagerAuthService],
})
export class AuthModule {}
