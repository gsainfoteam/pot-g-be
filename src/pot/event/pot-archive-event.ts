import { Pot } from "../model/pot";
import type { PotEvent } from "./pot-event";
import { PotEventStringType } from "../../../drizzle/schema/pot-event";
import { AssertIfValidPot } from "@src/pot/validator/common-pot-validator";

export type PotArchiveEventV1Dto = {
  potRoomPk: string;
};

export class PotArchiveEventV1 implements PotEvent<PotArchiveEventV1Dto> {
  private constructor(
    potPk: string,
    timestamp: Date,
    data: PotArchiveEventV1Dto,
  ) {
    this.potRoomPk = potPk;
    this.eventType = "archive_v1";
    this.timestamp = timestamp;
    this.data = data;
    this.dispatcher = PotArchiveEventV1.getDispatcherFunction();
  }

  static generatePotArchiveEvent(
    potPk: string,
    timestamp: Date,
    data: PotArchiveEventV1Dto,
  ) {
    return new PotArchiveEventV1(potPk, timestamp, data);
  }

  private static getDispatcherFunction(): (
    pot: Pot,
    data: PotArchiveEventV1Dto,
  ) => Pot {
    return (pot: Pot, data: PotArchiveEventV1Dto) => {
      // 방 존재 여부 확인 및 이미 삭제된 방인 경우 예외 발생
      AssertIfValidPot(pot, data.potRoomPk);

      pot.isArchived = true;

      return pot;
    };
  }

  readonly potRoomPk: string;
  readonly eventType: PotEventStringType;
  readonly timestamp: Date;
  readonly data: PotArchiveEventV1Dto;
  readonly dispatcher: (room: Pot, data: PotArchiveEventV1Dto) => Pot;
}
