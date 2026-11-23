import { StagingLogger } from "../global/logger/staging.logger";
import { Injectable } from "@nestjs/common";
import { WebsocketService } from "@src/websocket/websocket.service";
import { PotEventDto } from "@src/pot/event/v1/dto/pot-event.dto";
import { WsBaseDto } from "@src/websocket/dto/ws.base.dto";
import { randomUUID } from "node:crypto";
import {
  asyncScheduler,
  catchError,
  defer,
  EMPTY,
  subscribeOn,
  switchMap,
  timer,
} from "rxjs";
import { DeviceRepository } from "@src/database/repository/device.repository";
import { FcmService } from "@src/fcm/fcm.service";
import { PotEventChatV1Dto } from "@src/pot/event/v1/dto/pot-event.chat.v1.dto";
import { PotEventFofoChatV1Dto } from "@src/pot/event/v1/dto/pot-event.fofo-chat.v1.dto";
import { PotEventUserLeaveV1Dto } from "@src/pot/event/v1/dto/pot-event.user-leave.v1.dto";
import { PotEventUserKickV1Dto } from "@src/pot/event/v1/dto/pot-event.user-kick.v1.dto";
import { PotgWsClient } from "@src/websocket/potg.ws.client";
import { Trace } from "@gsainfoteam/nest-observability";
import { DeliveryUserProgress } from "../../drizzle/schema/fofo-chat-delivery";

@Trace()
@Injectable()
export class BroadcastingService {
  private readonly logger = new StagingLogger(BroadcastingService.name);

  constructor(
    private readonly websocketService: WebsocketService,
    private readonly fcmService: FcmService,
    private readonly deviceRepository: DeviceRepository,
  ) {}

  // Durable reservations keep ACK fallback and push retries separate from WS sends.
  async broadcastReservedPotEvent(
    event: PotEventDto<any>,
    userPks: string[],
    potName: string,
    progress: Record<string, DeliveryUserProgress>,
    saveProgress: () => Promise<void>,
    expiresAt?: Date,
  ): Promise<Date | undefined> {
    let nextAttempt: number | undefined;
    const retryAt = (time: number) => {
      nextAttempt = Math.min(nextAttempt ?? time, time);
    };
    for (const userPk of userPks) {
      if (expiresAt && expiresAt.getTime() <= Date.now()) break;
      let state = progress[userPk];
      const clients = this.websocketService.findClientByUserId(userPk);
      if (!state) {
        const message: WsBaseDto<PotEventDto<any>> = {
          type: "pot_event_receive",
          request_id: randomUUID(),
          body: event,
        };
        state = clients.length
          ? {
              stage: "ack",
              requestId: message.request_id,
              checkAfter: Date.now() + 10_000,
            }
          : { stage: "push" };
        progress[userPk] = state;
        // Persist before sending: recovery must not replay an already sent WS event.
        // If interrupted before sending, the durable ACK fallback still sends a push.
        await saveProgress();
        for (const client of clients) {
          if (client.getIsAuthorized()) client.sendMessage(message);
          // Do not queue reserved messages across reauthorization: membership may
          // change before the queue drains. The durable fallback handles these.
        }
      }
      if (state.stage === "done") continue;
      if (state.stage === "ack") {
        const requestId = state.requestId;
        const acknowledged = clients.some((client) =>
          client.findAckMessage(requestId, "pot_event_receive_res"),
        );
        if (acknowledged || event.event_type !== "popo_chat_v1") {
          progress[userPk] = { stage: "done" };
          await saveProgress();
          continue;
        }
        if (state.checkAfter > Date.now()) {
          retryAt(state.checkAfter);
          continue;
        }
        state = progress[userPk] = { stage: "push" };
        await saveProgress();
      }
      if (event.event_type !== "popo_chat_v1") {
        progress[userPk] = { stage: "done" };
        await saveProgress();
        continue;
      }
      // Re-read devices and push preferences even for an already pending device.
      const devices = (
        await this.getFcmTokensForUsers([userPk], "chatPush")
      ).filter(
        (device) =>
          !state.pendingDevicePks ||
          state.pendingDevicePks.includes(device.devicePk),
      );
      state.pendingDevicePks = devices.map((device) => device.devicePk);
      await saveProgress();
      if (expiresAt && expiresAt.getTime() <= Date.now()) break;
      if (devices.length) {
        const { results } = await this.fcmService.sendBulkPushNotification({
          fcmTokens: devices.map((device) => device.fcmToken),
          title: `${potName}: 포포`,
          body: (event.data as PotEventFofoChatV1Dto).content,
          deepLink: this.createDeeplink(event.pot_pk),
        });
        const permanentErrors = new Set([
          "messaging/registration-token-not-registered",
          "messaging/invalid-registration-token",
        ]);
        state.pendingDevicePks = devices
          .filter((_, index) => {
            const result = results[index];
            return !result?.success && !permanentErrors.has(result?.errorCode);
          })
          .map((device) => device.devicePk);
      }
      if (!state.pendingDevicePks.length) progress[userPk] = { stage: "done" };
      else retryAt(Date.now() + 60_000);
      // Record partial FCM success before another user or event is attempted.
      await saveProgress();
    }
    return nextAttempt === undefined ? undefined : new Date(nextAttempt);
  }

  asyncBroadcastPotEvent(
    potEventDto: PotEventDto<any>,
    userPks: string[] = [],
    potName?: string,
    senderName?: string,
  ) {
    this.logger.debug(
      `[asyncBroadcastPotEvent] ${potName ?? potEventDto.pot_pk} ${potEventDto.event_type}, users=${userPks.join(",")}`,
    );
    if (userPks.length === 0) {
      return;
    }
    defer(() =>
      this.broadcastPotEvent(potEventDto, userPks, potName, senderName),
    )
      .pipe(
        subscribeOn(asyncScheduler),
        catchError((err) => {
          this.logger.error(
            `[asyncBroadcastPotEvent] Broadcast failed for event type ${potEventDto.event_type}:`,
            err,
          );
          return EMPTY;
        }),
      )
      .subscribe();
  }

  async broadcastPotEvent(
    potEventDto: PotEventDto<any>,
    userPks: string[] = [],
    potName?: string,
    senderName?: string,
    retryPushFailures = false,
  ) {
    const potEventReceiveDto: WsBaseDto<PotEventDto<any>> = {
      type: "pot_event_receive",
      request_id: randomUUID(),
      body: potEventDto,
    };

    const pushAlarmTargetUserPks: string[] = [];

    // TODO
    // 현재 로직은 Redis 를 사용하지 않고 단일 서버에서 동작하는 경우에만 유효합니다.
    // 추후 서버가 여러대로 늘어나 경우 Redis 에 ws 연결 정보를 저장하고, 다른 서버에도 ws 연결이 없는 경우에만 푸시 알람을 보내도록 수정해야 합니다.
    userPks.forEach((userPk) => {
      const targetClients = this.websocketService.findClientByUserId(userPk);
      if (targetClients.length === 0) {
        // 오프라인 상태 -> 푸시 알람 발송
        pushAlarmTargetUserPks.push(userPk);
        this.logger.debug(`[broadcastPotEvent] user=${userPk} offline -> push`);
        return;
      }

      targetClients.forEach((targetClient) => {
        if (!targetClient.getIsAuthorized()) {
          // 인증되지 않은 상태 -> 대기열 추가
          this.logger.debug(
            `[broadcastPotEvent] user=${userPk} request_id=${potEventReceiveDto.request_id} not authorized -> queue WS message (no push fallback)`,
          );
          targetClient.addMessageToQueue(potEventReceiveDto);
          return;
        }

        this.logger.debug(
          `[broadcastPotEvent] user=${userPk} request_id=${potEventReceiveDto.request_id} event_type=${potEventDto.event_type} send WS message`,
        );
        targetClient.sendMessage(potEventReceiveDto);
        // TODO: targetClient 하나하나마다 10초 후에 ack 확인하는 비동기 작업을 시작하는게
        //  아니라 모두 보낸 후 한꺼번에 확인할 수 있을텐데 우선은 하지 않음
        timer(10000)
          .pipe(
            switchMap(() =>
              defer(() =>
                this.checkPotEventAck(
                  targetClient,
                  potEventReceiveDto,
                  potEventDto,
                  potName,
                  senderName,
                ),
              ),
            ),
            catchError((err) => {
              this.logger.error(
                `[broadcastPotEvent] Error checking ack for event type ${potEventDto.event_type}:`,
                err,
              );
              return EMPTY;
            }),
          )
          .subscribe();
      });
    });

    await this.sendPotEventPush(
      potEventDto,
      pushAlarmTargetUserPks,
      potName,
      senderName,
      retryPushFailures,
    );
  }

  async checkPotEventAck(
    targetClient: PotgWsClient,
    potEventReceiveDto: WsBaseDto<PotEventDto<any>>,
    potEventDto: PotEventDto<any>,
    potName?: string,
    senderName?: string,
  ) {
    if (
      targetClient.findAckMessage(
        potEventReceiveDto.request_id,
        potEventReceiveDto.type + "_res",
      )
    ) {
      // ack 가 도착했음
      this.logger.debug(
        `[checkPotEventAck] user=${targetClient.getUserId()} request_id=${potEventReceiveDto.request_id} ACK received -> skip push`,
      );
      return;
    }

    // findClientByUserId 메소드를 통해 targetClient 를 가져오기 때문에 userId 가 안들어있을 일이 없음.
    // 다만 타입스크립트 오류 방지를 위해 추가
    if (!targetClient.getUserId()) {
      return;
    }

    // 10초 대기 후에도 ack 가 오지 않는 경우 푸시 알람 발송
    this.logger.debug(
      `[checkPotEventAck] user=${targetClient.getUserId()} request_id=${potEventReceiveDto.request_id} ACK timeout -> push`,
    );
    await this.sendPotEventPush(
      potEventDto,
      [targetClient.getUserId()],
      potName,
      senderName,
    );
  }

  async sendPotEventPush(
    potEventDto: PotEventDto<any>,
    pushAlarmTargetUserPks: string[] = [],
    potName?: string,
    senderName?: string,
    retryPushFailures = false,
  ) {
    // 채팅 관련 이벤트인 경우에만 푸시 알람 발송
    if (potEventDto.event_type === "chat_v1") {
      await this.sendChatPush(
        potEventDto,
        pushAlarmTargetUserPks,
        potName,
        senderName,
      );
    } else if (potEventDto.event_type === "popo_chat_v1") {
      await this.sendFofoChatPush(
        potEventDto,
        pushAlarmTargetUserPks,
        potName,
        retryPushFailures,
      );
    } else if (potEventDto.event_type === "user_in_v1") {
      await this.sendUserInPush(potEventDto, pushAlarmTargetUserPks, potName);
    } else if (potEventDto.event_type === "user_leave_v1") {
      await this.sendUserLeavePush(
        potEventDto,
        pushAlarmTargetUserPks,
        potName,
      );
    } else if (potEventDto.event_type === "user_kick_v1") {
      await this.sendUserKickPush(potEventDto, pushAlarmTargetUserPks, potName);
    }
  }

  // TODO
  // 현재 로직은 Redis 를 사용하지 않고 단일 서버에서 동작하는 경우에만 유효합니다.
  // 추후 서버가 여러대로 늘어날 경우 Redis 에 ws 연결 정보가 저장되기 때문에 다른 서버에서 ws 연결을 끊을 수 있도록 메세지를 보내야 합니다.
  disconnectUser(userPk: string) {
    const targetClients = this.websocketService.findClientByUserId(userPk);
    targetClients.forEach((targetClient) => {
      targetClient.destroy();
    });
  }

  private async sendChatPush(
    potEventDto: PotEventDto<any>,
    pushAlarmTargetUserPks: string[] = [],
    potName?: string,
    senderName?: string,
  ) {
    const targetDevices = await this.getFcmTokensForUsers(
      pushAlarmTargetUserPks,
      "chatPush",
    );

    const potEventChatV1Dto = potEventDto.data as PotEventChatV1Dto;
    await this.sendPushToUser(
      potEventDto,
      targetDevices,
      `${potName}: ${senderName}`,
      potEventChatV1Dto.content,
    );
  }

  private async sendFofoChatPush(
    potEventDto: PotEventDto<any>,
    pushAlarmTargetUserPks: string[] = [],
    potName?: string,
    retryPushFailures = false,
  ) {
    const targetDevices = await this.getFcmTokensForUsers(
      pushAlarmTargetUserPks,
      "chatPush",
    );

    const potEventFofoChatV1Dto = potEventDto.data as PotEventFofoChatV1Dto;
    await this.sendPushToUser(
      potEventDto,
      targetDevices,
      `${potName}: 포포`,
      potEventFofoChatV1Dto.content,
      retryPushFailures,
    );
  }

  private async sendUserInPush(
    potEventDto: PotEventDto<any>,
    pushAlarmTargetUserPks: string[] = [],
    potName?: string,
  ) {
    const targetDevices = await this.getFcmTokensForUsers(
      pushAlarmTargetUserPks,
      "potInOutPush",
    );

    await this.sendPushToUser(
      potEventDto,
      targetDevices,
      `${potName}: 입퇴장 알림`,
      "사용자가 채팅방에 입장했습니다.",
    );
  }

  private async sendUserLeavePush(
    potEventDto: PotEventDto<any>,
    pushAlarmTargetUserPks: string[] = [],
    potName?: string,
  ) {
    const potEventUserLeaveV1Dto = potEventDto.data as PotEventUserLeaveV1Dto;

    // 채팅방을 퇴장한 유저는 제외하고 푸시 알림 발송
    const targetDevices = await this.getFcmTokensForUsers(
      pushAlarmTargetUserPks.filter(
        (userPk) => userPk !== potEventUserLeaveV1Dto.user_pk,
      ),
      "potInOutPush",
    );

    await this.sendPushToUser(
      potEventDto,
      targetDevices,
      `${potName}: 입퇴장 알림`,
      "사용자가 채팅방에서 퇴장했습니다.",
    );
  }

  private async sendUserKickPush(
    potEventDto: PotEventDto<any>,
    pushAlarmTargetUserPks: string[] = [],
    potName?: string,
  ) {
    const potEventUserKickV1Dto = potEventDto.data as PotEventUserKickV1Dto;

    const targetDevices = await this.getFcmTokensForUsers(
      pushAlarmTargetUserPks.filter(
        (userPk) => userPk !== potEventUserKickV1Dto.kicked_user_pk,
      ),
      "potInOutPush",
    );
    const kickedUserDevices = await this.getFcmTokensForUsers(
      [potEventUserKickV1Dto.kicked_user_pk],
      "potInOutPush",
    );

    await this.sendPushToUser(
      potEventDto,
      targetDevices,
      `${potName}: 입퇴장 알림`,
      "사용자가 채팅방에서 퇴장했습니다.",
    );

    await this.sendPushToUser(
      potEventDto,
      kickedUserDevices,
      `${potName}: 강퇴 알림`,
      "사용자가 채팅방에서 강퇴되었습니다.",
    );
  }

  private async getFcmTokensForUsers(
    userPks: string[],
    setting: "chatPush" | "potInOutPush",
  ) {
    if (userPks.length === 0) {
      return [];
    }

    // 한 채팅방에 참여중인 유저는 최대 4명이므로 동시에 4명에게 푸시 알람을 보내면 됩니다.
    // 큰 트래픽이 발생하지는 않으므로 네 요청을 모두 동시에 보내도 무방합니다.
    const devices = await this.deviceRepository.findFcmTokensByUserFks(userPks);
    for (const userPk of userPks) {
      if (!devices.some((device) => device.userFk === userPk)) {
        this.logger.debug(
          `[getFcmTokensForUsers] user=${userPk} no logged-in devices -> skip push`,
        );
      }
    }
    return devices.filter((tokenInfo) => {
      let reason = "enabled";
      if (!tokenInfo.fcmToken) {
        reason = "skip: missing token";
      } else if (tokenInfo[setting] == null) {
        reason = "skip: missing settings";
      } else if (!tokenInfo[setting]) {
        reason = "skip: disabled";
      }
      this.logger.debug(
        `[getFcmTokensForUsers] user=${tokenInfo.userFk} device_pk=${tokenInfo.devicePk} device_id=${tokenInfo.deviceId} token=${StagingLogger.tokenId(tokenInfo.fcmToken)} ${setting}=${tokenInfo[setting]} -> ${reason}`,
      );
      return Boolean(tokenInfo.fcmToken) && tokenInfo[setting] === true;
    });
  }

  private async sendPushToUser(
    potEventDto: PotEventDto<any>,
    devices: { devicePk: string; fcmToken: string }[],
    title: string,
    body: string,
    retryFailures = false,
  ) {
    if (devices.length === 0) {
      this.logger.debug(
        `[sendPushToUser] ${title} no eligible devices -> skip`,
      );
      return;
    }

    this.logger.debug(
      `[sendPushToUser] ${title} ${potEventDto.event_type}, targets=${devices.length} device_pks=${devices.map((d) => d.devicePk).join(",")}`,
    );
    try {
      const { results } = await this.fcmService.sendBulkPushNotification({
        fcmTokens: devices.map((device) => device.fcmToken),
        title: title,
        body: body,
        deepLink: this.createDeeplink(potEventDto.pot_pk),
      });
      const outcomes = results.map((result, index) => {
        let status = "accepted";
        if (!result.success) {
          status = "failed";
        }
        return { device_pk: devices[index].devicePk, status };
      });
      this.logger.debug(
        `[sendPushToUser] ${potEventDto.event_type} results=${JSON.stringify(outcomes)}`,
      );
      const permanentErrors = new Set([
        "messaging/registration-token-not-registered",
        "messaging/invalid-registration-token",
      ]);
      if (
        retryFailures &&
        results.some(
          (result) => !result.success && !permanentErrors.has(result.errorCode),
        )
      ) {
        throw new Error("Reserved notification push was not accepted by FCM");
      }
    } catch (e) {
      this.logger.error(
        `[sendPushToUser] Failed to send FCM notification for ${potEventDto.event_type}:.`,
        e,
      );
      if (retryFailures) throw e;
    }
  }

  private createDeeplink(potPk: string): string {
    return `/chat/${potPk}`;
  }
}
