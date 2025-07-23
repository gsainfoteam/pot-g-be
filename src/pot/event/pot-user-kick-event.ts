import { Pot } from "../model/pot";
import type { PotEvent } from "./pot-event";
import { PotEventStringType } from "../../../drizzle/schema/pot-event";
import {
  AssertIfDepartureTimeNotSet,
  AssertIfHost,
  AssertIfNotHost,
  AssertIfUserInPot,
  AssertIfValidPot,
} from "@src/pot/validator/common-pot-validator";

export type PotUserKickEventV1Dto = {
  potRoomPk: string; // 방의 ID
  userPk: string; // 방장 유저의 ID
  kickedUserPk: string; // 강퇴할 유저의 ID
};

export class PotUserKickEventV1 implements PotEvent<PotUserKickEventV1Dto> {
  private constructor(
    potPk: string,
    timestamp: Date,
    data: PotUserKickEventV1Dto,
  ) {
    this.potPk = potPk;
    this.eventType = "user_kick_v1";
    this.timestamp = timestamp;
    this.data = data;
    this.dispatcher = PotUserKickEventV1.getDispatcherFunction();
  }

  static generatePotUserKickEvent(
    potPk: string,
    timestamp: Date,
    data: PotUserKickEventV1Dto,
  ) {
    return new PotUserKickEventV1(potPk, timestamp, data);
  }

  private static getDispatcherFunction(): (
    pot: Pot,
    data: PotUserKickEventV1Dto,
  ) => Pot {
    return (pot: Pot, data: PotUserKickEventV1Dto) => {
      // 방 존재 여부 확인
      AssertIfValidPot(pot, data.potRoomPk);

      // 출발 시간이 정해지면 강퇴 불가
      AssertIfDepartureTimeNotSet(pot);

      // 방장만 강퇴 가능
      AssertIfHost(pot, data.userPk);

      // 방장을 강퇴할 수 없음
      AssertIfNotHost(pot, data.kickedUserPk, "Host cannot be kicked");

      // 강퇴할 유저가 방에 존재하는지 확인
      AssertIfUserInPot(pot, data.kickedUserPk);

      pot.joinedUserPks = pot.joinedUserPks.filter(
        (userId) => userId !== data.kickedUserPk,
      );

      return pot;
    };
  }

  readonly potPk: string;
  readonly eventType: PotEventStringType;
  readonly timestamp: Date;
  readonly data: PotUserKickEventV1Dto;
  readonly dispatcher: (room: Pot, data: PotUserKickEventV1Dto) => Pot;
}
