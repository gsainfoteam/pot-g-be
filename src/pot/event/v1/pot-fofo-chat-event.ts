import { Pot } from "../../model/pot";
import type { PotEvent } from "../pot-event";
import { PotEventStringType } from "../../../../drizzle/schema/pot-event";
import { parseSeoulDate } from "@src/global/utils/convert-date";
import {
  FofoActionBtnStringType,
  FofoChatStringType,
} from "../../../../drizzle/schema/fofo-chat-msg";
import { PotEventFofoChatV1Dto } from "@src/pot/event/v1/dto/pot-event.fofo-chat.v1.dto";
import * as format from "string-format";

export type PotFofoChatEventV1Schema = {
  // This key is persisted in pot_event.data; preserve the v1 storage contract.
  popoChatType: FofoChatStringType;
  message: string; // 채팅 메시지
  actionBtns: FofoActionBtnStringType[]; // 메시지에 포함된 액션 버튼들
  timestamp: Date; // 메시지 전송 시간
  formatArguments?: any; // 메시지 포맷팅에 사용되는 인자들
};

export class PotFofoChatEventV1
  implements PotEvent<PotFofoChatEventV1Schema, PotEventFofoChatV1Dto>
{
  private constructor(
    potPk: string,
    timestamp: Date,
    data: PotFofoChatEventV1Schema,
    id?: number,
  ) {
    this.potRoomPk = potPk;
    this.eventType = "popo_chat_v1";
    this.timestamp = timestamp;
    this.data = data;
    this.data.timestamp = parseSeoulDate(this.timestamp);
    this.id = id;
  }

  static generateEvent(
    potPk: string,
    timestamp: Date,
    data: PotFofoChatEventV1Schema,
    id?: number,
  ) {
    return new PotFofoChatEventV1(potPk, timestamp, data, id);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  dispatcher(pot: Pot, data: PotFofoChatEventV1Schema): Pot {
    return pot;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  validate(pot: Pot, data: PotFofoChatEventV1Schema) {}

  toDto(): PotEventFofoChatV1Dto {
    return {
      popo_chat_type: this.data.popoChatType,
      content: format(this.data.message, this.data.formatArguments),
      action_btns: this.data.actionBtns,
    };
  }

  readonly potRoomPk: string;
  readonly eventType: PotEventStringType;
  readonly timestamp: Date;
  readonly data: PotFofoChatEventV1Schema;
  readonly id?: number;
}
