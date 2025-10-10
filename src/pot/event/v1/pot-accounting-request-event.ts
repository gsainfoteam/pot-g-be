import { Pot } from "../../model/pot";
import type { PotEvent } from "../pot-event";
import { PotEventStringType } from "../../../../drizzle/schema/pot-event";
import {
  AssertIfAllUserInPot,
  AssertIfDeparted,
  AssertIfDepartureTimeSet,
  AssertIfUserInPot,
  AssertIfValidPot,
} from "@src/pot/validator/common-pot-validator";
import { PotEventAccountingRequestV1Dto } from "@src/pot/event/v1/dto/pot-event.accounting-request.v1.dto";

export type PotAccountingRequestEventV1Schema = {
  userPk: string; // 송금 받을 유저의 ID
  potRoomPk: string; // 송금 받을 방의 ID
  total_cost: number; // 송금 금액 (원)
  cost_per_user: number; // 1인당 송금 금액 (원)
  senderUserId: string[]; // 송금 보낼 유저의 ID 리스트
  bankPk: string; // 은행 pk
  bankName: string; // 은행 이름 (추후 사용자에게 보여주기 위함이므로 이름 저장)
  bankAccount: string; // 은행 계좌
};

export class PotAccountingRequestEventV1
  implements
    PotEvent<PotAccountingRequestEventV1Schema, PotEventAccountingRequestV1Dto>
{
  private constructor(
    potPk: string,
    timestamp: Date,
    data: PotAccountingRequestEventV1Schema,
  ) {
    this.potRoomPk = potPk;
    this.eventType = "accounting_request_v1";
    this.timestamp = timestamp;
    this.data = data;
  }

  static generatePotAccountingRequestEvent(
    potPk: string,
    timestamp: Date,
    data: PotAccountingRequestEventV1Schema,
  ) {
    return new PotAccountingRequestEventV1(potPk, timestamp, data);
  }

  dispatcher(pot: Pot, data: PotAccountingRequestEventV1Schema): Pot {
    // 송금 받을 유저와 송금 금액 설정
    pot.accountingRequestUserId = data.userPk;
    pot.totalCost = data.total_cost;
    pot.costPerUser = data.cost_per_user;
    pot.accountingRequestedUserPks = data.senderUserId;

    pot.bankPk = data.bankPk;
    pot.bankName = data.bankName;
    pot.bankAccount = data.bankAccount;

    return pot;
  }

  validate(pot: Pot, data: PotAccountingRequestEventV1Schema) {
    // 방 존재 여부 확인
    AssertIfValidPot(pot, data.potRoomPk);

    // 송금 받을 유저가 방에 존재하는지 확인
    AssertIfUserInPot(pot, data.userPk);

    // 출발 시간이 정해지지 않았거나 출발 시간+10분이 아직 지나지 않은 경우 예외 발생
    AssertIfDepartureTimeSet(pot);
    AssertIfDeparted(pot);

    // 송금 보낼 유저가 전부 방에 존재하는지 확인
    AssertIfAllUserInPot(
      pot,
      data.senderUserId,
      "All sender users must be in the pot",
    );
  }

  toDto(): PotEventAccountingRequestV1Dto {
    return {
      request_user_pk: this.data.userPk,
      requested_users_pk: this.data.senderUserId,
      total_cost: this.data.total_cost,
      cost_per_user: this.data.cost_per_user,
      bank_pk: this.data.bankPk,
      bank_name: this.data.bankName,
      bank_account: this.data.bankAccount,
    };
  }

  readonly potRoomPk: string;
  readonly eventType: PotEventStringType;
  readonly timestamp: Date;
  readonly data: PotAccountingRequestEventV1Schema;
}
