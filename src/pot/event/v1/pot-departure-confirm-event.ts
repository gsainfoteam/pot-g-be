import { Pot } from "../../model/pot";
import type { PotEvent } from "../pot-event";
import { PotEventStringType } from "../../../../drizzle/schema/pot-event";
import {
  AssertIfDepartureTimeBeforeNow,
  AssertIfHost,
  AssertIfValidDepartureTime,
  AssertIfValidPot,
} from "@src/pot/validator/common-pot-validator";
import { parseSeoulDate } from "@src/global/utils/convertDate";
import { PotEventDepartureConfirmV1Dto } from "@src/pot/event/v1/dto/pot-event.departure-confirm.v1.dto";

export type PotDepartureConfirmEventV1Schema = {
  potRoomPk: string;
  userPk: string;
  departureTime: Date;
};

export class PotDepartureConfirmEventV1
  implements
    PotEvent<PotDepartureConfirmEventV1Schema, PotEventDepartureConfirmV1Dto>
{
  private constructor(
    potPk: string,
    timestamp: Date,
    data: PotDepartureConfirmEventV1Schema,
    id?: number,
  ) {
    this.potRoomPk = potPk;
    this.eventType = "departure_confirm_v1";
    this.timestamp = timestamp;
    this.data = data;
    this.data.departureTime = parseSeoulDate(data.departureTime);
    this.id = id;
  }

  static generatePotDepartureConfirmEvent(
    potPk: string,
    timestamp: Date,
    data: PotDepartureConfirmEventV1Schema,
    id?: number,
  ) {
    return new PotDepartureConfirmEventV1(potPk, timestamp, data, id);
  }

  dispatcher(pot: Pot, data: PotDepartureConfirmEventV1Schema): Pot {
    pot.departureTime = data.departureTime;
    return pot;
  }

  validate(pot: Pot, data: PotDepartureConfirmEventV1Schema) {
    // 방 존재 여부 확인
    AssertIfValidPot(pot, data.potRoomPk);

    // 방장만 출발 확정을 정할 수 있음
    AssertIfHost(pot, data.userPk);

    // TODO: 이미 출발을 하지 않아야 함

    // 출발 시간이 현재 시간 이후여야 함
    AssertIfDepartureTimeBeforeNow(data.departureTime);

    // 출발 시간이 출발 가능 시작 시간과 출발 가능 종료 시간 사이여야 함
    AssertIfValidDepartureTime(pot, data.departureTime);
  }

  toDto(): PotEventDepartureConfirmV1Dto {
    return {
      user_pk: this.data.userPk,
      departure_time: this.data.departureTime,
    };
  }

  readonly potRoomPk: string;
  readonly eventType: PotEventStringType;
  readonly timestamp: Date;
  readonly data: PotDepartureConfirmEventV1Schema;
  readonly id?: number;
}
