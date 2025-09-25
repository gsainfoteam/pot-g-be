import { Injectable, OnModuleDestroy } from "@nestjs/common";
import { PotgWsClient } from "@src/websocket/potg.ws.client";
import { WsBaseDto, WsResponseDto } from "@src/websocket/dto/ws.base.dto";
import {
  WsAuthorizationReqDto,
  WsAuthorizationResDto,
} from "@src/websocket/dto/ws.authorization.dto";
import { AuthService } from "@src/auth/auth.service";
import type WebSocket from "ws";
import { randomUUID } from "node:crypto";
import { WsException } from "@nestjs/websockets";

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
    const potgWsClient = new PotgWsClient(wsClient);
    this.clients.push(potgWsClient);

    this.sendAuthorizationRequest(potgWsClient, this.getAuthorizationUntil());
  }

  deleteClient(wsClient: WebSocket) {
    this.clients = this.clients.filter((c) => c.getWsClient() !== wsClient);
  }

  checkIfValidClient(
    wsClient: WebSocket,
  ): { client: PotgWsClient; needAuthorization: boolean } | null {
    const client: PotgWsClient = this.findClient(wsClient);
    if (!client) {
      return null;
    }

    if (!client.getIsAuthorized()) {
      return { client, needAuthorization: true };
    }

    if (!client.isValidAccessToken()) {
      const until = this.getAuthorizationUntil();

      client.setNeedAuthorizationUntil(until);
      this.sendAuthorizationRequest(client, until);

      return { client, needAuthorization: true };
    }

    return { client, needAuthorization: false };
  }

  async authorization(
    wsClient: WebSocket,
    payload: WsBaseDto<WsAuthorizationResDto>,
  ) {
    const client = this.findClient(wsClient);
    if (!client) {
      throw new WsException("Client not found");
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

    // 요청 상관관계 검증
    client.resolveRequestId(payload.request_id, "request_authorization");

    // 엑세스 토큰 확인
    const accessToken = payload.body.authorization;
    const { userId, deviceId, validUntil } =
      await this.authService.validateAccessToken(accessToken);
    if (!userId) {
      throw new WsException("Invalid refresh token"); // TODO
    }

    // 인증 처리
    client.setAuthorized(userId, deviceId, accessToken, validUntil);
    client.sendMessage(okRes);

    await client.waitForAllTasks();
  }

  private findClient(wsClient: WebSocket): PotgWsClient | undefined {
    return this.clients.find((c) => c.getWsClient() === wsClient);
  }

  private getAuthorizationUntil(): Date {
    return new Date(Date.now() + this.AUTHORIZATION_TIMEOUT_MS);
  }

  private sendAuthorizationRequest(
    client: PotgWsClient,
    authorizationUntil: Date,
  ) {
    client.setNeedAuthorizationUntil(authorizationUntil);

    const requestAuthorization: WsBaseDto<WsAuthorizationReqDto> = {
      type: "request_authorization",
      request_id: randomUUID(),
      body: {
        authorization_until: authorizationUntil,
      },
    };

    client.sendMessage(requestAuthorization);

    setTimeout(
      () => {
        if (!client.getIsAuthorized()) {
          client.destroy();
        }
      },
      this.AUTHORIZATION_TIMEOUT_MS + 5 * 1000,
    ); // 5초 여유
  }
}
