import { Injectable } from "@nestjs/common";
import { WebsocketService } from "@src/websocket/websocket.service";
import { PotEventDto } from "@src/pot/dto/event/pot-event.dto";
import { WsBaseDto } from "@src/websocket/dto/ws.base.dto";
import { randomUUID } from "node:crypto";

@Injectable()
export class BroadcastingService {
  constructor(private websocketService: WebsocketService) {}

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
        // 인증되지 않은 상태 -> 대기열 추가 TODO
        pushAlarmTargetUserPks.push(userPk);
        return;
      }

      targetClient.sendMessage(potEventReceiveDto);
    });

    // TODO: 푸시 알람 발송 (rxjs)
  }
}
