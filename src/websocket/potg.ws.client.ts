import { WsBaseDto } from "@src/websocket/dto/ws.base.dto";
import { sendWsBaseDtoToClient } from "@src/websocket/websocket.utils";

export class PotgWsClient {
  private readonly wsClient: WebSocket;
  private isAuthorized: boolean;
  private needAuthorizationUntil: Date | null;
  private userId: string | null;
  private deviceId: string | null;
  private accessToken: string | null;
  private sentMessageMap: Map<string, WsBaseDto<any>>;

  constructor(wsClient: WebSocket, needAuthorizationUntil: Date) {
    this.wsClient = wsClient;
    this.isAuthorized = false;
    this.needAuthorizationUntil = needAuthorizationUntil;
    this.userId = null;
    this.accessToken = null;
    this.sentMessageMap = new Map();
  }

  getWsClient() {
    return this.wsClient;
  }

  getIsAuthorized() {
    return this.isAuthorized;
  }

  getUserId() {
    return this.userId;
  }

  getDeviceId() {
    return this.deviceId;
  }

  getAccessToken() {
    return this.accessToken;
  }

  sendMessage(message: WsBaseDto<any>) {
    this.addSentMessageToQueue(message);
    sendWsBaseDtoToClient(this.wsClient, message);
  }

  setAuthorized(userId: string, deviceId: string, accessToken: string) {
    // check if authorization process expired
    if (this.needAuthorizationUntil) {
      const now = new Date();
      if (now > this.needAuthorizationUntil) {
        throw new Error("Authorization process expired");
      }
    }

    this.isAuthorized = true;
    this.userId = userId;
    this.deviceId = deviceId;
    this.accessToken = accessToken;
    this.needAuthorizationUntil = null;
  }

  private addSentMessageToQueue(message: WsBaseDto<any>) {
    this.sentMessageMap.set(message.request_id, message);
  }

  getSentMessageFromQueue(requestId: string): WsBaseDto<any> | undefined {
    return this.sentMessageMap.get(requestId);
  }

  removeSentMessageFromQueue(requestId: string) {
    this.sentMessageMap.delete(requestId);
  }
}
