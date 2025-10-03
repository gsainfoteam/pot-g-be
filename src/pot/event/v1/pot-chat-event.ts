import { Pot } from "../../model/pot";
import type { PotEvent } from "../pot-event";
import { PotEventStringType } from "../../../../drizzle/schema/pot-event";
import {
  AssertIfUserInPot,
  AssertIfValidPot,
} from "@src/pot/validator/common-pot-validator";
import { parseDate } from "@src/global/utils/convertDate";
import { PotEventChatV1Dto } from "@src/pot/event/v1/dto/pot-event.chat.v1.dto";

export type PotChatEventV1Schema = {
  potRoomPk: string;
  userPk: string; // 채팅을 보낸 유저의 ID
  message: string; // 채팅 메시지
  timestamp: Date; // 메시지 전송 시간
};

export class PotChatEventV1
  implements PotEvent<PotChatEventV1Schema, PotEventChatV1Dto>
{
  private constructor(
    potPk: string,
    timestamp: Date,
    data: PotChatEventV1Schema,
  ) {
    this.potRoomPk = potPk;
    this.eventType = "chat_v1";
    this.timestamp = timestamp;
    this.data = data;
    this.data.timestamp = parseDate(this.timestamp);
  }

  static generatePotChatEvent(
    potPk: string,
    timestamp: Date,
    data: PotChatEventV1Schema,
  ) {
    return new PotChatEventV1(potPk, timestamp, data);
  }

  dispatcher(pot: Pot, data: PotChatEventV1Schema): Pot {
    // 채팅 이외의 모든 데이터는 건드리지 않아야 합니다.
    // 즉 채팅 이벤트를 제외하고 Pot Event 를 조회하여 Dispatch 하여도 무관하여야 합니다.
    // 채팅 메시지를 방의 채팅 기록에 추가
    pot.chatHistory.push({
      userPk: data.userPk,
      message: data.message,
      timestamp: data.timestamp,
    });

    return pot;
  }

  validate(pot: Pot, data: PotChatEventV1Schema) {
    // 방 존재 여부 확인 및 이미 삭제된 방인 경우 예외 발생
    AssertIfValidPot(pot, data.potRoomPk);

    // 채팅을 보낸 유저가 방에 존재하는지 확인
    AssertIfUserInPot(pot, data.userPk);
  }

  toDto(): PotEventChatV1Dto {
    return {
      from: this.data.userPk,
      content: this.data.message,
    };
  }

  readonly potRoomPk: string;
  readonly eventType: PotEventStringType;
  readonly timestamp: Date;
  readonly data: PotChatEventV1Schema;
}
