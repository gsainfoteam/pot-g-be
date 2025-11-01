import { Injectable, Logger } from "@nestjs/common";
import { WebsocketService } from "@src/websocket/websocket.service";
import { PotEventDto } from "@src/pot/event/v1/dto/pot-event.dto";
import { WsBaseDto } from "@src/websocket/dto/ws.base.dto";
import { randomUUID } from "node:crypto";
import { asyncScheduler, scheduled } from "rxjs";
import { DeviceRepository } from "@src/database/repository/device.repository";
import { FcmService } from "@src/fcm/fcm.service";
import { PotEventChatV1Dto } from "@src/pot/event/v1/dto/pot-event.chat.v1.dto";
import { PotEventPopoChatV1Dto } from "@src/pot/event/v1/dto/pot-event.popo-chat.v1.dto";
import { PotEventUserLeaveV1Dto } from "@src/pot/event/v1/dto/pot-event.user-leave.v1.dto";
import { PotEventUserKickV1Dto } from "@src/pot/event/v1/dto/pot-event.user-kick.v1.dto";

@Injectable()
export class BroadcastingService {
  private readonly logger = new Logger(BroadcastingService.name);

  constructor(
    private readonly websocketService: WebsocketService,
    private readonly fcmService: FcmService,
    private readonly deviceRepository: DeviceRepository,
  ) {}

  asyncBroadcastPotEvent(
    potEventDto: PotEventDto<any>,
    userPks: string[] = [],
    potName?: string,
    senderName?: string,
  ) {
    if (userPks.length === 0) {
      return;
    }
    scheduled(
      this.broadcastPotEvent(potEventDto, userPks, potName, senderName),
      asyncScheduler,
    ).subscribe({
      error: (err) => {
        this.logger.error(
          `Broadcast failed for event type ${potEventDto.event_type}:`,
          err,
        );
      },
    });
  }

  async broadcastPotEvent(
    potEventDto: PotEventDto<any>,
    userPks: string[] = [],
    potName?: string,
    senderName?: string,
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
        return;
      }

      targetClients.forEach((targetClient) => {
        if (!targetClient.getIsAuthorized()) {
          // 인증되지 않은 상태 -> 대기열 추가
          targetClient.addMessageToQueue(potEventReceiveDto);
          return;
        }

        targetClient.sendMessage(potEventReceiveDto);
      });
    });

    // 채팅 관련 이벤트인 경우에만 푸시 알람 발송
    if (potEventDto.event_type === "chat_v1") {
      await this.sendChatPush(
        potEventDto,
        pushAlarmTargetUserPks,
        potName,
        senderName,
      );
    } else if (potEventDto.event_type === "popo_chat_v1") {
      await this.sendPopoChatPush(potEventDto, pushAlarmTargetUserPks, potName);
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

  private async sendChatPush(
    potEventDto: PotEventDto<any>,
    pushAlarmTargetUserPks: string[] = [],
    potName?: string,
    senderName?: string,
  ) {
    const targetFcmTokens = await this.getFcmTokensForUsers(
      pushAlarmTargetUserPks,
    );

    const potEventChatV1Dto = potEventDto.data as PotEventChatV1Dto;
    await this.sendPushToUser(
      potEventDto,
      targetFcmTokens
        .filter((tokenInfo) => tokenInfo.chatPush)
        .map((tokenInfo) => tokenInfo.fcmToken),
      `${potName}: ${senderName}`,
      potEventChatV1Dto.content,
    );
  }

  private async sendPopoChatPush(
    potEventDto: PotEventDto<any>,
    pushAlarmTargetUserPks: string[] = [],
    potName?: string,
  ) {
    const targetFcmTokens = await this.getFcmTokensForUsers(
      pushAlarmTargetUserPks,
    );

    const potEventPopoChatV1Dto = potEventDto.data as PotEventPopoChatV1Dto;
    await this.sendPushToUser(
      potEventDto,
      targetFcmTokens
        .filter((tokenInfo) => tokenInfo.chatPush)
        .map((tokenInfo) => tokenInfo.fcmToken),
      `${potName}: 포포`,
      potEventPopoChatV1Dto.content,
    );
  }

  private async sendUserInPush(
    potEventDto: PotEventDto<any>,
    pushAlarmTargetUserPks: string[] = [],
    potName?: string,
  ) {
    const targetFcmTokens = await this.getFcmTokensForUsers(
      pushAlarmTargetUserPks,
    );

    await this.sendPushToUser(
      potEventDto,
      targetFcmTokens
        .filter((tokenInfo) => tokenInfo.potInOutPush)
        .map((tokenInfo) => tokenInfo.fcmToken),
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
    const targetFcmTokens = await this.getFcmTokensForUsers(
      pushAlarmTargetUserPks.filter(
        (userPk) => userPk !== potEventUserLeaveV1Dto.user_pk,
      ),
    );

    await this.sendPushToUser(
      potEventDto,
      targetFcmTokens
        .filter((tokenInfo) => tokenInfo.potInOutPush)
        .map((tokenInfo) => tokenInfo.fcmToken),
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

    const targetFcmTokens = await this.getFcmTokensForUsers(
      pushAlarmTargetUserPks.filter(
        (userPk) => userPk !== potEventUserKickV1Dto.kicked_user_pk,
      ),
    );
    const kickedUserFcmTokens = await this.getFcmTokensForUsers([
      potEventUserKickV1Dto.kicked_user_pk,
    ]);

    await this.sendPushToUser(
      potEventDto,
      targetFcmTokens
        .filter((tokenInfo) => tokenInfo.potInOutPush)
        .map((tokenInfo) => tokenInfo.fcmToken),
      `${potName}: 입퇴장 알림`,
      "사용자가 채팅방에서 퇴장했습니다.",
    );

    await this.sendPushToUser(
      potEventDto,
      kickedUserFcmTokens
        .filter((tokenInfo) => tokenInfo.potInOutPush)
        .map((tokenInfo) => tokenInfo.fcmToken),
      `${potName}: 강퇴 알림`,
      "사용자가 채팅방에서 강퇴되었습니다.",
    );
  }

  private async getFcmTokensForUsers(userPks: string[]) {
    if (userPks.length === 0) {
      return [];
    }

    // 한 채팅방에 참여중인 유저는 최대 4명이므로 동시에 4명에게 푸시 알람을 보내면 됩니다.
    // 큰 트래픽이 발생하지는 않으므로 네 요청을 모두 동시에 보내도 무방합니다.
    return (await this.deviceRepository.findFcmTokensByUserFks(userPks)).filter(
      (tokenInfo) => {
        if (tokenInfo.fcmToken !== null && tokenInfo.fcmToken !== "") {
          return true;
        }
        if (
          tokenInfo.chatPush ||
          tokenInfo.marketingPush ||
          tokenInfo.potInOutPush
        ) {
          return true;
        }
      },
    );
  }

  private async sendPushToUser(
    potEventDto: PotEventDto<any>,
    fcmTokens: string[],
    title: string,
    body: string,
  ) {
    if (fcmTokens.length === 0) {
      return;
    }

    try {
      await this.fcmService.sendBulkPushNotification({
        fcmTokens: fcmTokens,
        title: title,
        body: body,
        deepLink: this.createDeeplink(potEventDto.pot_pk),
      });
    } catch (e) {
      this.logger.error(
        `Failed to send FCM notification for ${potEventDto.event_type}:`,
        e,
      );
    }
  }

  private createDeeplink(potPk: string): string {
    return `/chat/${potPk}`;
  }
}
