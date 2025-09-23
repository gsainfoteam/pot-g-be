import { Pot } from "../model/pot";
import type { PotEvent } from "./pot-event";
import { PotEventStringType } from "../../../drizzle/schema/pot-event";

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
      if (pot.pk !== data.potRoomPk || pot.isArchived) {
        throw new Error("Pot ID does not match or pot is archived");
      }

      // 이미 참여한 유저인 경우 참여 불가
      if (pot.joinedUserPks.includes(data.userPk)) {
        throw new Error("User already joined the pot");
      }

      // 방 인원 초과인 경우 참여 불가
      if (pot.joinedUserPks.length >= pot.maxCapacity) {
        throw new Error("Pot is full");
      }

      // 출발 시간이 정해지면 참여 불가
      if (pot.departureTime !== null) {
        throw new Error("Departure time is already set");
      }

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
