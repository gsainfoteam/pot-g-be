import { Module } from "@nestjs/common";
import { REDIS_SERVICE_TOKEN } from "@src/redis/i-redis-service";
import { RedisService } from "@src/redis/redis.service";

@Module({
  imports: [],
  providers: [
    {
      provide: REDIS_SERVICE_TOKEN,
      useClass: RedisService,
    },
  ],
  exports: [REDIS_SERVICE_TOKEN],
})
export class RedisModule {}
