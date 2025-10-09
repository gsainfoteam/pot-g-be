import { Pot } from "../../model/pot";
import type { PotEvent } from "../pot-event";
import { PotEventStringType } from "../../../../drizzle/schema/pot-event";
import {
  AssertIfDepartureTimeNotSet,
  AssertIfHost,
  AssertIfNotHost,
  AssertIfUserAccountingRequestedAndNotConfirmed,
  AssertIfUserInPot,
  AssertIfValidPot,
} from "@src/pot/validator/common-pot-validator";
import { PotEventUserKickV1Dto } from "@src/pot/event/v1/dto/pot-event.user-kick.v1.dto";

export type PotUserKickEventV1Schema = {
  potRoomPk: string; // 방의 ID
  userPk: string; // 방장 유저의 ID
  kickedUserPk: string; // 강퇴할 유저의 ID
};

export class PotUserKickEventV1
  implements PotEvent<PotUserKickEventV1Schema, PotEventUserKickV1Dto>
{
  private constructor(
    potPk: string,
    timestamp: Date,
    data: PotUserKickEventV1Schema,
  ) {
    this.potRoomPk = potPk;
    this.eventType = "user_kick_v1";
    this.timestamp = timestamp;
    this.data = data;
  }

  static generatePotUserKickEvent(
    potPk: string,
    timestamp: Date,
    data: PotUserKickEventV1Schema,
  ) {
    return new PotUserKickEventV1(potPk, timestamp, data);
  }

  dispatcher(pot: Pot, data: PotUserKickEventV1Schema): Pot {
    pot.joinedUserPks = pot.joinedUserPks.filter(
      (userId) => userId !== data.kickedUserPk,
    );

    return pot;
  }

  validate(pot: Pot, data: PotUserKickEventV1Schema) {
    // 방 존재 여부 확인
    AssertIfValidPot(pot, data.potRoomPk);

    // 출발 시간이 정해지면 강퇴 불가
    AssertIfDepartureTimeNotSet(pot);

    // 방장만 강퇴 가능
    AssertIfHost(pot, data.userPk);

    // 방장을 강퇴할 수 없음
    AssertIfNotHost(pot, data.kickedUserPk);

    // 강퇴할 유저가 방에 존재하는지 확인
    AssertIfUserInPot(pot, data.kickedUserPk);

    // 강퇴할 유저가 정산 대기중이면 강퇴 불가
    AssertIfUserAccountingRequestedAndNotConfirmed(pot, data.kickedUserPk);
  }

  toDto(): PotEventUserKickV1Dto {
    return {
      host_user_pk: this.data.userPk,
      kicked_user_pk: this.data.kickedUserPk,
    };
  }

  readonly potRoomPk: string;
  readonly eventType: PotEventStringType;
  readonly timestamp: Date;
  readonly data: PotUserKickEventV1Schema;
}
