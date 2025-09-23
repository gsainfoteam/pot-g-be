import { Module } from "@nestjs/common";
import { DatabaseModule } from "./database/database.module";
import { ConfigModule } from "./config/config.module";
import { UserModule } from "@src/user/user.module";
import { AuthModule } from "@src/auth/auth.module";
import { RedisModule } from "@src/redis/redis.module";
import { KeyPairModule } from "@src/keypair/key-pair.module";
import { DiscoveryModule } from "@src/discovery/discovery.module";
import { AccountingModule } from "@src/accounting/accounting.module";
import { PotModule } from "@src/pot/pot.module";

@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    UserModule,
    AuthModule,
    RedisModule,
    KeyPairModule,
    DiscoveryModule,
    AccountingModule,
    PotModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
