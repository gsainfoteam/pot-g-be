import type { TaxiRoute } from "../model/pot";
import { Pot } from "../model/pot";
import type { PotEvent } from "./pot-event";
import { PotEventStringType } from "../../../drizzle/schema/pot-event";

//Fixme : Id들이 그대로 복원이 안됨 아예 인풋으로 받아야함
export type PotCreateEventV1Dto = {
  potRoomPk: string;
  name: string;
  createUserId: string;
  route: TaxiRoute;
  maxCapacity: number;
  departureAvailableStartTime: Date;
  departureAvailableEndTime: Date;
};

export class PotCreateEventV1 implements PotEvent<PotCreateEventV1Dto> {
  private constructor(
    potPk: string,
    timestamp: Date,
    data: PotCreateEventV1Dto,
  ) {
    this.potPk = potPk;
    this.eventType = "create_v1";
    this.timestamp = timestamp;
    this.data = data;
    this.dispatcher = PotCreateEventV1.getDispatcherFunction();
  }

  static generatePotCreateEvent(
    potPk: string,
    timestamp: Date,
    data: PotCreateEventV1Dto,
  ) {
    return new PotCreateEventV1(potPk, timestamp, data);
  }

  private static getDispatcherFunction(): (
    pot: Pot,
    data: PotCreateEventV1Dto,
  ) => Pot {
    return (pot: Pot, data: PotCreateEventV1Dto) => {
      const now = new Date();

      // 출발 가능 시간의 범위는 현재 시간 이후여야 한다.
      if (
        data.departureAvailableStartTime < now ||
        data.departureAvailableEndTime < now
      ) {
        throw new Error(
          "Departure start time or end time must be in the future",
        );
      }

      // 출발 가능 시작 시간은 출발 가능 종료 시간 이전이어야 한다.
      if (data.departureAvailableStartTime > data.departureAvailableEndTime) {
        throw new Error("Departure start time must be before end time");
      }

      // 출발 가능 시작 시간과 출발 종료시간은 24시간 이상 차이날 수 없다
      if (
        data.departureAvailableEndTime.getTime() -
          data.departureAvailableStartTime.getTime() >
        24 * 60 * 60 * 1000
      ) {
        throw new Error(
          "Departure start time and end time must be within 24 hours",
        );
      }

      // 최대 인원 수는 1명 이상 4명 이하여야 한다.
      if (data.maxCapacity <= 0 || data.maxCapacity > 4) {
        throw new Error("Max capacity must be between 1 and 5");
      }

      // 출발 가능 종료 시간은 현재 시간 이후 30일 이내여야 한다.
      if (
        data.departureAvailableEndTime >
        new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
      ) {
        throw new Error("Departure end time must be within one month");
      }

      pot.pk = data.potRoomPk;
      const randomNumber = pot.pk.slice(-4);

      pot.hostUserPk = data.createUserId;
      pot.joinedUserPks.push(data.createUserId);
      pot.name = Pot.generateRoomName(data.route, randomNumber);
      pot.route = data.route;

      pot.maxCapacity = data.maxCapacity;
      pot.departureAvailableStartTime = data.departureAvailableStartTime;
      pot.departureAvailableEndTime = data.departureAvailableEndTime;

      pot.createAt = now;
      pot.updateAt = now;

      pot.departureTime = null;
      pot.isArchived = false;

      return pot;
    };
  }

  readonly potPk: string;
  readonly eventType: PotEventStringType;
  readonly timestamp: Date;
  readonly data: PotCreateEventV1Dto;
  readonly dispatcher: (room: Pot, data: PotCreateEventV1Dto) => Pot;
}
