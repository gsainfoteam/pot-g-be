import { Injectable } from "@nestjs/common";
import { WebsocketService } from "@src/websocket/websocket.service";
import { PotEventDto } from "@src/pot/event/v1/dto/pot-event.dto";
import { WsBaseDto } from "@src/websocket/dto/ws.base.dto";
import { randomUUID } from "node:crypto";
import { from } from "rxjs";

@Injectable()
export class BroadcastingService {
  constructor(private websocketService: WebsocketService) {}

  asyncBroadcastPotEvent(
    potEventDto: PotEventDto<any>,
    userPks: string[] = [],
  ) {
    from(this.broadcastPotEvent(potEventDto, userPks)).subscribe({
      error: (err) => console.error("Broadcast failed:", err),
    });
  }

  async broadcastPotEvent(
    potEventDto: PotEventDto<any>,
    userPks: string[] = [],
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
      const targetClient = this.websocketService.findClientByUserId(userPk);
      if (!targetClient) {
        // 오프라인 상태 -> 푸시 알람 발송
        pushAlarmTargetUserPks.push(userPk);
        return;
      }

      if (!targetClient.getIsAuthorized()) {
        // 인증되지 않은 상태 -> 대기열 추가
        targetClient.addMessageToQueue(potEventReceiveDto);
        return;
      }

      targetClient.sendMessage(potEventReceiveDto);
    });

    // TODO: 푸시 알람 발송 (rxjs)
    // 한 채팅방에 참여중인 유저는 최대 4명이므로 동시에 4명에게 푸시 알람을 보내면 됩니다.
    // 큰 트래픽이 발생하지는 않으므로 네 요청을 모두 동시에 보내도 무방합니다.
  }
}
