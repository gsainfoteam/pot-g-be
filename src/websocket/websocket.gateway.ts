import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
} from "@nestjs/websockets";
import { WsBaseDto } from "@src/websocket/dto/ws.base.dto";
import { WsAuthorizationResDto } from "@src/websocket/dto/ws.authorization.dto";
import { WebsocketService } from "@src/websocket/websocket.service";

@WebSocketGateway({ path: "/ws" })
export class WebsocketGateway
  implements OnGatewayConnection<WebSocket>, OnGatewayDisconnect<WebSocket>
{
  constructor(private readonly websocketService: WebsocketService) {}

  handleConnection(client: WebSocket): any {
    this.websocketService.addClient(client);
  }

  handleDisconnect(client: WebSocket): any {
    this.websocketService.deleteClient(client);
  }

  @SubscribeMessage("authorization")
  async authorization(
    @ConnectedSocket() client: WebSocket,
    @MessageBody() payload: WsBaseDto<WsAuthorizationResDto>,
  ) {
    await this.websocketService.authorization(client, payload);
  }
}
