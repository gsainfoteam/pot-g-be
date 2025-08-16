import { Module } from "@nestjs/common";
import { HttpModule } from "@nestjs/axios";
import { AuthService } from "@src/auth/auth.service";
import { InfoteamIdpModule } from "@lib/infoteam-idp";
import { UserGuard } from "@src/auth/guard/user.guard";
import { JwtStrategy } from "@src/auth/strategy/jwt.strategy";
import { JwtModule } from "@nestjs/jwt";
import { DatabaseModule } from "@src/database/database.module";
import { KeyPairService } from "@src/keypair/key-pair.service";
import { KeyPairModule } from "@src/keypair/key-pair.module";

@Module({
  imports: [
    HttpModule.register({
      timeout: 1000,
      maxRedirects: 5,
    }),
    InfoteamIdpModule,
    JwtModule.registerAsync({
      imports: [KeyPairModule],
      useFactory: async (keyPairService: KeyPairService) => ({
        privateKey: (await keyPairService.getKeyPair()).privateKey,
      }),
      inject: [KeyPairService],
    }),
    DatabaseModule,
    KeyPairModule,
  ],
  providers: [
    AuthService,
    UserGuard,
    {
      provide: JwtStrategy,
      useFactory: async (keyPairService: KeyPairService) => {
        return new JwtStrategy((await keyPairService.getKeyPair()).privateKey);
      },
      inject: [KeyPairService],
    },
  ],
  exports: [AuthService, JwtStrategy],
})
export class AuthModule {}
