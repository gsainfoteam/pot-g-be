import { Module } from "@nestjs/common";
import { HttpModule } from "@nestjs/axios";
import { AuthService } from "@src/auth/auth.service";
import { InfoteamIdpModule } from "@lib/infoteam-idp";
import { UserGuard } from "@src/auth/guard/user.guard";
import { JwtStrategy } from "@src/auth/strategy/jwt-strategy.service";
import { JwtModule } from "@nestjs/jwt";

@Module({
  imports: [
    HttpModule.register({
      timeout: 1000,
      maxRedirects: 5,
    }),
    InfoteamIdpModule,
    JwtModule.registerAsync({
      useFactory: async (authService: AuthService) => ({
        privateKey: (await authService.getKeyPair()).privateKey,
      }),
      inject: [AuthService],
    }),
  ],
  providers: [AuthService, UserGuard, JwtStrategy],
  exports: [AuthService, JwtStrategy],
})
export class AuthModule {}
