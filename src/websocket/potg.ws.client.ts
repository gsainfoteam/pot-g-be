import { WsBaseDto } from "@src/websocket/dto/ws.base.dto";
import { sendWsBaseDtoToClient } from "@src/websocket/websocket.utils";
import type WebSocket from "ws";
import { WsException } from "@nestjs/websockets";

export class PotgWsClient {
  private readonly wsClient: WebSocket;
  private isAuthorized: boolean;
  private needAuthorizationUntil: Date | null;
  private userId: string | null;
  private userName: string | null;
  private devicePk: string | null;
  private accessToken: string | null;
  private validUntil: Date | null;
  private sentMessageMap: Map<string, WsBaseDto<any>>;
  private queuedTasks: (() => Promise<any>)[];
  private queuedMessages: WsBaseDto<any>[];

  constructor(wsClient: WebSocket) {
    this.wsClient = wsClient;
    this.isAuthorized = false;
    this.needAuthorizationUntil = null;
    this.userId = null;
    this.userName = null;
    this.accessToken = null;
    this.devicePk = null;
    this.validUntil = null;
    this.sentMessageMap = new Map();
    this.queuedTasks = [];
    this.queuedMessages = [];
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

  getUserName() {
    return this.userName;
  }

  getDeviceId() {
    return this.devicePk;
  }

  getAccessToken() {
    return this.accessToken;
  }

  isValidAccessToken() {
    if (!this.validUntil) {
      return false;
    }

    const now = new Date();
    return now < this.validUntil;
  }

  destroy() {
    this.wsClient.close();
    this.sentMessageMap.clear();
    this.queuedTasks = [];
    this.queuedMessages = [];
  }

  sendMessage(message: WsBaseDto<any>) {
    this.addSentMessageToQueue(message);
    sendWsBaseDtoToClient(this.wsClient, message);
  }

  setAuthorized(
    userId: string,
    devicePk: string,
    accessToken: string,
    validUntil: Date,
  ) {
    // check if authorization process expired
    if (this.needAuthorizationUntil) {
      const now = new Date();
      if (now > this.needAuthorizationUntil) {
        throw new Error("Authorization process expired");
      }
    }

    this.isAuthorized = true;
    this.userId = userId;
    this.devicePk = devicePk;
    this.accessToken = accessToken;
    this.validUntil = validUntil;
    this.needAuthorizationUntil = null;
  }

  setNeedAuthorizationUntil(needAuthorizationUntil: Date) {
    this.accessToken = null;
    this.validUntil = null;
    this.isAuthorized = false;
    this.needAuthorizationUntil = needAuthorizationUntil;
  }

  setUserName(userName: string) {
    this.userName = userName;
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

  addTaskToQueue<T>(task: () => Promise<T>) {
    this.queuedTasks.push(task);
  }

  addMessageToQueue(message: WsBaseDto<any>) {
    this.queuedMessages.push(message);
  }

  async sendQueuedMessages() {
    // 메세지들을 모두 처리하기 전에 다시 호출되는 경우를 방지
    const messagesToSend = [...this.queuedMessages];

    this.queuedMessages = [];
    for (const message of messagesToSend) {
      this.sendMessage(message);
      // 딜레이 10ms
      const delay = new Promise((resolve) => setTimeout(resolve, 10));
      await delay;
    }
  }

  async waitForAllTasks() {
    for (const task of this.queuedTasks) {
      await task();
    }
  }

  resolveRequestId(requestId: string, type: string) {
    const pendingReq = this.getSentMessageFromQueue(requestId);
    if (!pendingReq || pendingReq.type !== type) {
      // 알 수 없는 요청
      this.removeSentMessageFromQueue(requestId); // 혹시 남아있다면 정리
      throw new WsException("Unknown message");
    }
    this.removeSentMessageFromQueue(requestId);
  }
}
