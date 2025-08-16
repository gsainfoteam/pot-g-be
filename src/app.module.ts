import { Module } from "@nestjs/common";
import { DatabaseModule } from "./database/database.module";
import { ConfigModule } from "./config/config.module";
import { UserModule } from "@src/user/user.module";
import { AuthModule } from "@src/auth/auth.module";
import { RedisModule } from "@src/redis/redis.module";

@Module({
  imports: [ConfigModule, DatabaseModule, UserModule, AuthModule, RedisModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
