import { Pot } from "../model/pot";
import type { PotEvent } from "./pot-event";
import { PotEventStringType } from "../../../drizzle/schema/pot-event";
import {
  AssertIfAllUserInPot,
  AssertIfDeparted,
  AssertIfDepartureTimeSet,
  AssertIfUserInPot,
  AssertIfValidPot,
} from "@src/pot/validator/common-pot-validator";

export type PotAccountingRequestEventV1Dto = {
  userPk: string; // 송금 받을 유저의 ID
  potRoomPk: string; // 송금 받을 방의 ID
  amount: number; // 송금 금액 (원)
  senderUserId: string[]; // 송금 보낼 유저의 ID 리스트
};

export class PotAccountingRequestEventV1
  implements PotEvent<PotAccountingRequestEventV1Dto>
{
  private constructor(
    potPk: string,
    timestamp: Date,
    data: PotAccountingRequestEventV1Dto,
  ) {
    this.potRoomPk = potPk;
    this.eventType = "accounting_request_v1";
    this.timestamp = timestamp;
    this.data = data;
    this.dispatcher = PotAccountingRequestEventV1.getDispatcherFunction();
  }

  static generatePotAccountingRequestEvent(
    potPk: string,
    timestamp: Date,
    data: PotAccountingRequestEventV1Dto,
  ) {
    return new PotAccountingRequestEventV1(potPk, timestamp, data);
  }

  private static getDispatcherFunction(): (
    pot: Pot,
    data: PotAccountingRequestEventV1Dto,
  ) => Pot {
    return (
      pot: Pot,
      data: PotAccountingRequestEventV1Dto,
      validation?: boolean,
    ) => {
      if (validation) {
        // 방 존재 여부 확인
        AssertIfValidPot(pot, data.potRoomPk);

        // 송금 받을 유저가 방에 존재하는지 확인
        AssertIfUserInPot(pot, data.userPk);

        // 출발 시간이 정해지지 않았거나 출발 시간+30분이 아직 지나지 않은 경우 예외 발생
        AssertIfDepartureTimeSet(pot);
        AssertIfDeparted(pot);

        // 송금 보낼 유저가 전부 방에 존재하는지 확인
        AssertIfAllUserInPot(
          pot,
          data.senderUserId,
          "All sender users must be in the pot",
        );
      }

      // 송금 받을 유저와 송금 금액 설정
      pot.accountingRequestUserId = data.userPk;
      pot.recipientAmount = data.amount;
      pot.accountingRequestedUserPks = data.senderUserId;

      return pot;
    };
  }

  readonly potRoomPk: string;
  readonly eventType: PotEventStringType;
  readonly timestamp: Date;
  readonly data: PotAccountingRequestEventV1Dto;
  readonly dispatcher: (room: Pot, data: PotAccountingRequestEventV1Dto) => Pot;
}
