import { Pot } from "../../model/pot";
import type { PotEvent } from "../pot-event";
import { PotEventStringType } from "../../../../drizzle/schema/pot-event";
import {
  AssertIfAccountingRequested,
  AssertIfDeparted,
  AssertIfDepartureTimeSet,
  AssertIfValidPot,
} from "@src/pot/validator/common-pot-validator";
import { PotEventAccountingConfirmV1Dto } from "@src/pot/event/v1/dto/pot-event.accounting-confirm.v1.dto";

export type PotAccountingConfirmResultSchema = {
  userPk: string;
  accountingDone: boolean;
};

export type PotAccountingConfirmEventV1Schema = {
  potRoomPk: string; // 송금 받을 방의 ID
  results: PotAccountingConfirmResultSchema[];
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
    const joinedConfirmResults = data.results.filter(({ userPk }) =>
      pot.joinedUserPks.includes(userPk),
    );

    const sentUserPks = joinedConfirmResults
      .filter(({ accountingDone }) => accountingDone)
      .map(({ userPk }) => userPk);

    const notSentUserPks = joinedConfirmResults
      .filter(({ accountingDone }) => !accountingDone)
      .map(({ userPk }) => userPk);

    sentUserPks.forEach((userPk) => {
      if (pot.accountingRequestedUserPks.includes(userPk)) {
        pot.accountingRequestedUserPks = pot.accountingRequestedUserPks.filter(
          (userId) => userId !== userPk,
        );
      }
      if (!pot.accountingConfirmedUserPks.includes(userPk)) {
        pot.accountingConfirmedUserPks.push(userPk);
      }
    });

    notSentUserPks.forEach((userPk) => {
      if (!pot.accountingRequestedUserPks.includes(userPk)) {
        pot.accountingRequestedUserPks.push(userPk);
      }
      if (pot.accountingConfirmedUserPks.includes(userPk)) {
        pot.accountingConfirmedUserPks = pot.accountingConfirmedUserPks.filter(
          (userId) => userId !== userPk,
        );
      }
    });

    return pot;
  }

  validate(pot: Pot, data: PotAccountingConfirmEventV1Schema) {
    // 방 존재 여부 확인
    AssertIfValidPot(pot, data.potRoomPk);

    // 정산 요청이 왔는지 확인
    AssertIfAccountingRequested(pot);

    // 출발 시간이 정해지지 않았거나 출발 시간+30분이 아직 지나지 않은 경우 예외 발생
    AssertIfDepartureTimeSet(pot);
    AssertIfDeparted(pot);
  }

  toDto(): PotEventAccountingConfirmV1Dto {
    return {};
  }

  readonly potRoomPk: string;
  readonly eventType: PotEventStringType;
  readonly timestamp: Date;
  readonly data: PotAccountingConfirmEventV1Schema;
}
