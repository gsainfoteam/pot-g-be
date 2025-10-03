import { Pot } from "../../model/pot";
import type { PotEvent } from "../pot-event";
import { PotEventStringType } from "../../../../drizzle/schema/pot-event";
import {
  AssertIfAccountingRequestedUser,
  AssertIfDeparted,
  AssertIfDepartureTimeSet,
  AssertIfUserInPot,
  AssertIfValidPot,
} from "@src/pot/validator/common-pot-validator";
import { PotEventAccountingConfirmV1Dto } from "@src/pot/event/v1/dto/pot-event.accounting-confirm.v1.dto";

export type PotAccountingConfirmEventV1Schema = {
  userPk: string; // 송금 받을 유저의 ID
  potRoomPk: string; // 송금 받을 방의 ID
  sentUserId: string; // 송금 보낸 유저의 ID
};

// 송금 확인 이벤트
export class PotAccountingConfirmEventV1
  implements
    PotEvent<PotAccountingConfirmEventV1Schema, PotEventAccountingConfirmV1Dto>
{
  private constructor(
    potPk: string,
    timestamp: Date,
    data: PotAccountingConfirmEventV1Schema,
  ) {
    this.potRoomPk = potPk;
    this.eventType = "accounting_confirm_v1";
    this.timestamp = timestamp;
    this.data = data;
  }

  static generatePotAccountingConfirmEvent(
    potPk: string,
    timestamp: Date,
    data: PotAccountingConfirmEventV1Schema,
  ) {
    return new PotAccountingConfirmEventV1(potPk, timestamp, data);
  }

  dispatcher(pot: Pot, data: PotAccountingConfirmEventV1Schema): Pot {
    // 송금 보낼 유저 제거
    pot.accountingRequestedUserPks = pot.accountingRequestedUserPks.filter(
      (userId) => userId !== data.sentUserId,
    );

    // 송금 보낸 유저 추가
    pot.accountingConfirmedUserPks.push(data.sentUserId);

    return pot;
  }

  validate(pot: Pot, data: PotAccountingConfirmEventV1Schema) {
    // 방 존재 여부 확인
    AssertIfValidPot(pot, data.potRoomPk);

    // 송금 받을 유저가 방에 존재하는지 확인
    AssertIfUserInPot(pot, data.userPk);

    // 출발 시간이 정해지지 않았거나 출발 시간+30분이 아직 지나지 않은 경우 예외 발생
    AssertIfDepartureTimeSet(pot);
    AssertIfDeparted(pot);

    // 해당 유저가 송금 받을 유저인지 확인
    AssertIfAccountingRequestedUser(pot, data.userPk);
  }

  toDto(): PotEventAccountingConfirmV1Dto {
    return {
      confirm_user_pk: this.data.sentUserId,
    };
  }

  readonly potRoomPk: string;
  readonly eventType: PotEventStringType;
  readonly timestamp: Date;
  readonly data: PotAccountingConfirmEventV1Schema;
}
