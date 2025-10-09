import { forwardRef, Module } from "@nestjs/common";
import { DatabaseModule } from "@src/database/database.module";
import { AuthModule } from "@src/auth/auth.module";
import { WebsocketGateway } from "@src/websocket/websocket.gateway";
import { WebsocketService } from "@src/websocket/websocket.service";
import { PotModule } from "@src/pot/pot.module";

@Module({
  imports: [DatabaseModule, AuthModule, forwardRef(() => PotModule)],
  providers: [WebsocketGateway, WebsocketService],
  exports: [WebsocketService],
})
export class WebsocketModule {}
