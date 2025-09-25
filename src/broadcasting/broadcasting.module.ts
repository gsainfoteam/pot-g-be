import { Module } from "@nestjs/common";
import { WebsocketModule } from "@src/websocket/websocket.module";
import { BroadcastingService } from "@src/broadcasting/broadcasting.service";

@Module({
  imports: [WebsocketModule], // TODO: RedisModule
  providers: [BroadcastingService],
  exports: [BroadcastingService],
})
export class BroadcastingModule {}
