import { Pot } from "../model/pot";
import { PotArchiveEventV1 } from "./pot-archive-event";
import type { PotEvent } from "./pot-event";
import { PotEventReducer } from "./pot-event-reducer";
import { PotEventStringType } from "../../../drizzle/schema/pot-event";
import {
  AssertIfDepartureTimeNotSet,
  AssertIfUserInPot,
  AssertIfValidPot,
} from "@src/pot/validator/common-pot-validator";

export type PotUserLeaveEventV1Dto = {
  potRoomPk: string; // 퇴장할 방의 ID
  userPk: string; // 퇴장할 유저의 ID
};

export class PotUserLeaveEventV1 implements PotEvent<PotUserLeaveEventV1Dto> {
  private constructor(
    potPk: string,
    timestamp: Date,
    data: PotUserLeaveEventV1Dto,
  ) {
    this.potPk = potPk;
    this.eventType = "user_leave_v1";
    this.timestamp = timestamp;
    this.data = data;
    this.dispatcher = PotUserLeaveEventV1.getDispatcherFunction();
  }

  static generatePotUserOutEvent(
    potPk: string,
    timestamp: Date,
    data: PotUserLeaveEventV1Dto,
  ) {
    return new PotUserLeaveEventV1(potPk, timestamp, data);
  }

  private static getDispatcherFunction(): (
    pot: Pot,
    data: PotUserLeaveEventV1Dto,
  ) => Pot {
    return (pot: Pot, data: PotUserLeaveEventV1Dto) => {
      // 방 존재 여부 확인
      AssertIfValidPot(pot, data.potRoomPk);

      // 출발 시간이 정해지면 퇴장 불가
      AssertIfDepartureTimeNotSet(pot);

      // 퇴장할 유저가 방에 존재하는지 확인
      AssertIfUserInPot(pot, data.userPk);

      // 퇴장할 유저 제거
      pot.joinedUserPks = pot.joinedUserPks.filter(
        (userId) => userId !== data.userPk,
      );

      // 방에 남은 유저가 없는 경우 방 삭제
      if (pot.joinedUserPks.length === 0) {
        const roomArchiveEvent = PotArchiveEventV1.generatePotArchiveEvent(
          pot.pk,
          new Date(),
          {
            potRoomPk: pot.pk,
          },
        );
        pot = PotEventReducer.reduce(pot, roomArchiveEvent);
        return pot;
      }

      // 퇴장한 유저가 방장인 경우 방장 선출
      if (pot.hostUserPk === data.userPk) {
        pot.hostUserPk = pot.joinedUserPks[0];
      }

      return pot;
    };
  }

  readonly potPk: string;
  readonly eventType: PotEventStringType;
  readonly timestamp: Date;
  readonly data: PotUserLeaveEventV1Dto;
  readonly dispatcher: (room: Pot, data: PotUserLeaveEventV1Dto) => Pot;
}
