import { Pot } from "../../model/pot";
import type { PotEvent } from "../pot-event";
import { PotEventStringType } from "../../../../drizzle/schema/pot-event";
import { parseSeoulDate } from "@src/global/utils/convertDate";
import {
  PopoActionBtnStringType,
  PopoChatStringType,
} from "../../../../drizzle/schema/popo-chat-msg";
import { PotEventPopoChatV1Dto } from "@src/pot/event/v1/dto/pot-event.popo-chat.v1.dto";
import * as format from "string-format";

export type PotPopoChatEventV1Schema = {
  popoChatType: PopoChatStringType;
  message: string; // 채팅 메시지
  actionBtns: PopoActionBtnStringType[]; // 메시지에 포함된 액션 버튼들
  timestamp: Date; // 메시지 전송 시간
  formatArguments?: any; // 메시지 포맷팅에 사용되는 인자들
};

export class PotPopoChatEventV1
  implements PotEvent<PotPopoChatEventV1Schema, PotEventPopoChatV1Dto>
{
  private constructor(
    potPk: string,
    timestamp: Date,
    data: PotPopoChatEventV1Schema,
  ) {
    this.potRoomPk = potPk;
    this.eventType = "popo_chat_v1";
    this.timestamp = timestamp;
    this.data = data;
    this.data.timestamp = parseSeoulDate(this.timestamp);
  }

  static generateEvent(
    potPk: string,
    timestamp: Date,
    data: PotPopoChatEventV1Schema,
  ) {
    return new PotPopoChatEventV1(potPk, timestamp, data);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  dispatcher(pot: Pot, data: PotPopoChatEventV1Schema): Pot {
    return pot;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  validate(pot: Pot, data: PotPopoChatEventV1Schema) {}

  toDto(): PotEventPopoChatV1Dto {
    return {
      popo_chat_type: this.data.popoChatType,
      content: format(this.data.message, this.data.formatArguments),
      action_btns: this.data.actionBtns,
    };
  }

  readonly potRoomPk: string;
  readonly eventType: PotEventStringType;
  readonly timestamp: Date;
  readonly data: PotPopoChatEventV1Schema;
}
