import { Module } from "@nestjs/common";
import { WebsocketModule } from "@src/websocket/websocket.module";
import { BroadcastingService } from "@src/broadcasting/broadcasting.service";
import { DatabaseModule } from "@src/database/database.module";
import { FcmModule } from "@src/fcm/fcm.module";

@Module({
  imports: [WebsocketModule, DatabaseModule, FcmModule], // TODO: RedisModule
  providers: [BroadcastingService],
  exports: [BroadcastingService],
})
export class BroadcastingModule {}
