import { Pot } from "../model/pot";
import type { PotEvent } from "./pot-event";
import { PotEventStringType } from "../../../drizzle/schema/pot-event";

export type PotDepartureConfirmEventV1Dto = {
  potRoomPk: string;
  userPk: string;
  departureTime: Date;
};

export class PotDepartureConfirmEventV1
  implements PotEvent<PotDepartureConfirmEventV1Dto>
{
  private constructor(
    potPk: string,
    timestamp: Date,
    data: PotDepartureConfirmEventV1Dto,
  ) {
    this.potRoomPk = potPk;
    this.eventType = "departure_confirm_v1";
    this.timestamp = timestamp;
    this.data = data;
    this.dispatcher = PotDepartureConfirmEventV1.getDispatcherFunction();
  }

  static generatePotDepartureConfirmEvent(
    potPk: string,
    timestamp: Date,
    data: PotDepartureConfirmEventV1Dto,
  ) {
    return new PotDepartureConfirmEventV1(potPk, timestamp, data);
  }

  private static getDispatcherFunction(): (
    pot: Pot,
    data: PotDepartureConfirmEventV1Dto,
  ) => Pot {
    return (pot: Pot, data: PotDepartureConfirmEventV1Dto) => {
      // 방 존재 여부 확인
      if (pot.pk !== data.potRoomPk || pot.isArchived) {
        throw new Error("Pot ID does not match or pot is archived");
      }

      // 방장만 출발 확정을 정할 수 있음
      if (pot.hostUserPk !== data.userPk) {
        throw new Error("User is not the host");
      }

      // 출발 시간이 정해지지 않은 경우에만 출발 확정 가능
      if (pot.departureTime !== null) {
        throw new Error("Departure time already set");
      }

      // 출발 시간이 현재 시간 이후여야 함
      if (data.departureTime < new Date()) {
        throw new Error("Departure time must be in the future");
      }

      // 출발 시간이 출발 가능 시작 시간과 출발 가능 종료 시간 사이여야 함
      if (
        data.departureTime < pot.departureAvailableStartTime ||
        data.departureTime > pot.departureAvailableEndTime
      ) {
        throw new Error(
          "Departure time must be between departure available start time and end time",
        );
      }

      pot.departureTime = data.departureTime;
      return pot;
    };
  }

  readonly potRoomPk: string;
  readonly eventType: PotEventStringType;
  readonly timestamp: Date;
  readonly data: PotDepartureConfirmEventV1Dto;
  readonly dispatcher: (room: Pot, data: PotDepartureConfirmEventV1Dto) => Pot;
}
