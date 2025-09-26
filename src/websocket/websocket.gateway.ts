import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WsException,
} from "@nestjs/websockets";
import { WsBaseDto } from "@src/websocket/dto/ws.base.dto";
import { WsAuthorizationResDto } from "@src/websocket/dto/ws.authorization.dto";
import { WebsocketService } from "@src/websocket/websocket.service";
import type WebSocket from "ws";
import { WsSendChatReqDto } from "@src/websocket/dto/ws.send-chat.dto";

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

  @SubscribeMessage("send_chat")
  async sendChat(
    @ConnectedSocket() client: WebSocket,
    @MessageBody() payload: WsBaseDto<WsSendChatReqDto>,
  ) {
    const validClient = this.websocketService.checkIfValidClient(client);
    if (!validClient) {
      throw new WsException("Client not found");
    }
    if (validClient.needAuthorization) {
      // 프로미스 생성 시 바로 실행이 되기 때문에 지연시키기 위해 람다로 감싸서 저장합니다.
      validClient.client.addTaskToQueue(() =>
        this.websocketService.sendChat(validClient.client, payload),
      );
      return;
    }

    await this.websocketService.sendChat(validClient.client, payload);
  }
}
