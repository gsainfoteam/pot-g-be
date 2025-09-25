import { Injectable, OnModuleDestroy } from "@nestjs/common";
import { PotgWsClient } from "@src/websocket/potg.ws.client";
import { WsBaseDto, WsResponseDto } from "@src/websocket/dto/ws.base.dto";
import {
  WsAuthorizationReqDto,
  WsAuthorizationResDto,
} from "@src/websocket/dto/ws.authorization.dto";
import { AuthService } from "@src/auth/auth.service";

@Injectable()
export class WebsocketService implements OnModuleDestroy {
  private readonly AUTHORIZATION_TIMEOUT_MS = 30 * 1000; // 30초
  private clients: PotgWsClient[] = [];

  constructor(private readonly authService: AuthService) {}

  onModuleDestroy() {
    // 모든 클라이언트의 연결을 종료
    this.clients.forEach((client) => {
      client.getWsClient().close();
    });
  }

  addClient(wsClient: WebSocket) {
    const authorizationUntil = new Date(
      Date.now() + this.AUTHORIZATION_TIMEOUT_MS,
    );
    const potgWsClient = new PotgWsClient(wsClient, authorizationUntil);
    this.clients.push(potgWsClient);
    this.sendAuthorizationRequest(potgWsClient, authorizationUntil);
  }

  deleteClient(wsClient: WebSocket) {
    this.clients = this.clients.filter((c) => c.getWsClient() !== wsClient);
  }

  async authorization(
    wsClient: WebSocket,
    payload: WsBaseDto<WsAuthorizationResDto>,
  ) {
    const client = this.findClient(wsClient);
    if (!client) {
      throw new Error("Client not found");
    }

    const okRes: WsBaseDto<WsResponseDto> = WsResponseDto.OK(
      "authorization_res",
      payload.request_id,
    );

    // 이미 인증된 클라이언트인지 확인
    if (client.getIsAuthorized()) {
      client.sendMessage(okRes);
      return;
    }

    // 엑세스 토큰 확인
    const accessToken = payload.body.authorization;
    const { userId, deviceId } =
      await this.authService.validateRefreshToken(accessToken);
    if (!userId) {
      throw new Error("Invalid refresh token"); // TODO
    }

    // 인증 처리
    client.setAuthorized(userId, deviceId, accessToken);
    client.sendMessage(okRes);

    await client.waitForAllTasks();
  }

  private findClient(wsClient: WebSocket): PotgWsClient | undefined {
    return this.clients.find((c) => c.getWsClient() === wsClient);
  }

  private sendAuthorizationRequest(
    client: PotgWsClient,
    authorizationUntil: Date,
  ) {
    const requestAuthorization: WsBaseDto<WsAuthorizationReqDto> = {
      type: "request_authorization",
      request_id: crypto.randomUUID(),
      body: {
        authorization_until: authorizationUntil,
      },
    };

    client.sendMessage(requestAuthorization);

    setTimeout(
      () => {
        if (!client.getIsAuthorized()) {
          client.getWsClient().close();
        }
      },
      this.AUTHORIZATION_TIMEOUT_MS + 5 * 1000,
    ); // 5초 여유
  }
}
