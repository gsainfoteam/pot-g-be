import { Pot } from "../../model/pot";
import type { PotEvent } from "../pot-event";
import { PotEventStringType } from "../../../../drizzle/schema/pot-event";
import { AssertIfValidPot } from "@src/pot/validator/common-pot-validator";

export type PotArchiveEventV1Schema = {
  potRoomPk: string;
};

export class PotArchiveEventV1 implements PotEvent<PotArchiveEventV1Schema> {
  private constructor(
    potPk: string,
    timestamp: Date,
    data: PotArchiveEventV1Schema,
  ) {
    this.potRoomPk = potPk;
    this.eventType = "archive_v1";
    this.timestamp = timestamp;
    this.data = data;
  }

  static generatePotArchiveEvent(
    potPk: string,
    timestamp: Date,
    data: PotArchiveEventV1Schema,
  ) {
    return new PotArchiveEventV1(potPk, timestamp, data);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  dispatcher(pot: Pot, _: PotArchiveEventV1Schema): Pot {
    pot.isArchived = true;

    return pot;
  }

  validate(pot: Pot, data: PotArchiveEventV1Schema) {
    // 방 존재 여부 확인 및 이미 삭제된 방인 경우 예외 발생
    AssertIfValidPot(pot, data.potRoomPk);
  }

  readonly potRoomPk: string;
  readonly eventType: PotEventStringType;
  readonly timestamp: Date;
  readonly data: PotArchiveEventV1Schema;
}
