import { Pot } from "../model/pot";
import type { PotEvent } from "./pot-event";
import { PotEventStringType } from "../../../drizzle/schema/pot-event";
import {
  AssertIfUserInPot,
  AssertIfValidPot,
} from "@src/pot/validator/common-pot-validator";
import { parseDate } from "@src/global/utils/convertDate";

export type PotChatEventV1Dto = {
  potRoomPk: string;
  userPk: string; // 채팅을 보낸 유저의 ID
  message: string; // 채팅 메시지
  timestamp: Date; // 메시지 전송 시간
};

export class PotChatEventV1 implements PotEvent<PotChatEventV1Dto> {
  private constructor(potPk: string, timestamp: Date, data: PotChatEventV1Dto) {
    this.potRoomPk = potPk;
    this.eventType = "chat_v1";
    this.timestamp = timestamp;
    this.data = {
      potRoomPk: data.potRoomPk,
      userPk: data.userPk,
      message: data.message,
      timestamp: parseDate(data.timestamp),
    };
    this.dispatcher = PotChatEventV1.getDispatcherFunction();
  }

  static generatePotChatEvent(
    potPk: string,
    timestamp: Date,
    data: PotChatEventV1Dto,
  ) {
    return new PotChatEventV1(potPk, timestamp, data);
  }

  private static getDispatcherFunction(): (
    pot: Pot,
    data: PotChatEventV1Dto,
  ) => Pot {
    return (pot: Pot, data: PotChatEventV1Dto, validation?: boolean) => {
      if (validation) {
        // 방 존재 여부 확인 및 이미 삭제된 방인 경우 예외 발생
        AssertIfValidPot(pot, data.potRoomPk);

        // 채팅을 보낸 유저가 방에 존재하는지 확인
        AssertIfUserInPot(pot, data.userPk);
      }

      // 채팅 이외의 모든 데이터는 건드리지 않아야 합니다.
      // 즉 채팅 이벤트를 제외하고 Pot Event 를 조회하여 Dispatch 하여도 무관하여야 합니다.
      // 채팅 메시지를 방의 채팅 기록에 추가
      pot.chatHistory.push({
        userPk: data.userPk,
        message: data.message,
        timestamp: data.timestamp,
      });

      return pot;
    };
  }

  readonly potRoomPk: string;
  readonly eventType: PotEventStringType;
  readonly timestamp: Date;
  readonly data: PotChatEventV1Dto;
  readonly dispatcher: (room: Pot, data: PotChatEventV1Dto) => Pot;
}
