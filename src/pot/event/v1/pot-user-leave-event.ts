import { Pot } from "../../model/pot";
import type { PotEvent } from "../pot-event";
import { PotEventStringType } from "../../../../drizzle/schema/pot-event";
import {
  AssertIfDepartureTimeNotSet,
  AssertIfUserAccountingRequestedAndNotConfirmed,
  AssertIfUserAccountingRequestingAndNotCompleted,
  AssertIfUserInPot,
  AssertIfValidPot,
} from "@src/pot/validator/common-pot-validator";
import { PotEventUserLeaveV1Dto } from "@src/pot/event/v1/dto/pot-event.user-leave.v1.dto";

export type PotUserLeaveEventV1Schema = {
  potRoomPk: string; // 퇴장할 방의 ID
  userPk: string; // 퇴장할 유저의 ID
  host_changed_to?: string; // 방장이 변경된 경우 변경된 방장 ID (dispatch 에 의해서만 생성됩니다.)
};

export class PotUserLeaveEventV1
  implements PotEvent<PotUserLeaveEventV1Schema, PotEventUserLeaveV1Dto>
{
  private constructor(
    potPk: string,
    timestamp: Date,
    data: PotUserLeaveEventV1Schema,
  ) {
    this.potRoomPk = potPk;
    this.eventType = "user_leave_v1";
    this.timestamp = timestamp;
    this.data = data;
  }

  static generatePotUserLeaveEvent(
    potPk: string,
    timestamp: Date,
    data: PotUserLeaveEventV1Schema,
  ) {
    return new PotUserLeaveEventV1(potPk, timestamp, data);
  }

  dispatcher(pot: Pot, data: PotUserLeaveEventV1Schema): Pot {
    // 퇴장할 유저 제거
    pot.joinedUserPks = pot.joinedUserPks.filter(
      (userId) => userId !== data.userPk,
    );

    // 퇴장한 유저가 방장인 경우 방장 선출
    if (pot.hostUserPk === data.userPk && pot.joinedUserPks.length > 0) {
      pot.hostUserPk = pot.joinedUserPks[0];
      this.data.host_changed_to = pot.hostUserPk;
    }

    return pot;
  }

  validate(pot: Pot, data: PotUserLeaveEventV1Schema) {
    // 방 존재 여부 확인
    AssertIfValidPot(pot, data.potRoomPk);

    // 출발 시간이 정해지면 퇴장 불가
    AssertIfDepartureTimeNotSet(pot);

    // 퇴장할 유저가 방에 존재하는지 확인
    AssertIfUserInPot(pot, data.userPk);

    // 본인이 정산 요청 대상자이고 본인의 정산이 완료되지 않았는지 확인
    AssertIfUserAccountingRequestedAndNotConfirmed(pot, data.userPk);

    // 본인이 정산자인데 정산이 완료되지 않은 다른 사람이 있는지 확인
    AssertIfUserAccountingRequestingAndNotCompleted(pot, data.userPk);
  }

  toDto(): PotEventUserLeaveV1Dto {
    return {
      user_pk: this.data.userPk,
      host_changed_to: this.data.host_changed_to || undefined,
    };
  }

  readonly potRoomPk: string;
  readonly eventType: PotEventStringType;
  readonly timestamp: Date;
  readonly data: PotUserLeaveEventV1Schema;
}
