import { Pot } from "../model/pot";
import type { PotEvent } from "./pot-event";
import { PotEventStringType } from "../../../drizzle/schema/pot-event";
import { PotEventError } from "@src/global/exceptions/pot-event.error";
import { BaseResultDto } from "@src/global/dto/base-result.dto";
import {
  AssertIfDepartureTimeNotSet,
  AssertIfPotFull,
  AssertIfValidPot,
} from "@src/pot/validator/common-pot-validator";

export type PotUserInEventV1Dto = {
  potRoomPk: string;
  userPk: string;
};

export class PotUserInEventV1 implements PotEvent<PotUserInEventV1Dto> {
  private constructor(
    potPk: string,
    timestamp: Date,
    data: PotUserInEventV1Dto,
  ) {
    this.potRoomPk = potPk;
    this.eventType = "user_in_v1";
    this.timestamp = timestamp;
    this.data = data;
    this.dispatcher = PotUserInEventV1.getDispatcherFunction();
  }

  static generatePotUserInEvent(
    potPk: string,
    timestamp: Date,
    data: PotUserInEventV1Dto,
  ) {
    return new PotUserInEventV1(potPk, timestamp, data);
  }

  private static getDispatcherFunction(): (
    pot: Pot,
    data: PotUserInEventV1Dto,
  ) => Pot {
    return (pot: Pot, data: PotUserInEventV1Dto) => {
      // 방 존재 여부 확인
      AssertIfValidPot(pot, data.potRoomPk);

      // 이미 참여한 유저인 경우 참여 불가
      if (pot.joinedUserPks.includes(data.userPk)) {
        throw new PotEventError(BaseResultDto.OK);
      }

      // 방 인원 초과인 경우 참여 불가
      AssertIfPotFull(pot);

      // 출발 시간이 정해지면 참여 불가
      AssertIfDepartureTimeNotSet(pot);

      pot.joinedUserPks.push(data.userPk);
      return pot;
    };
  }

  readonly potRoomPk: string;
  readonly eventType: PotEventStringType;
  readonly timestamp: Date;
  readonly data: PotUserInEventV1Dto;
  readonly dispatcher: (room: Pot, data: PotUserInEventV1Dto) => Pot;
}
