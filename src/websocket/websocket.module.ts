import { Module } from "@nestjs/common";
import { DatabaseModule } from "@src/database/database.module";
import { AuthModule } from "@src/auth/auth.module";
import { WebsocketGateway } from "@src/websocket/websocket.gateway";
import { WebsocketService } from "@src/websocket/websocket.service";

@Module({
  imports: [DatabaseModule, AuthModule],
  providers: [WebsocketGateway, WebsocketService],
})
export class WebsocketModule {}
