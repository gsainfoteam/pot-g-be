import { PotEventStringType } from "../../../drizzle/schema/pot-event";
import { PotEvent } from "@src/pot/event/pot-event";
import { Pot } from "@src/pot/model/pot";
import {
  AssertIfValidCapacity,
  AssertIfValidDepartureAvailableTime,
} from "@src/pot/validator/common-pot-validator";
import { parseDate } from "@src/global/utils/convertDate";

export type PotCreateEventV1Dto = {
  potRoomPk: string;
  name: string;
  createUserId: string;
  routePk: string;
  maxCapacity: number;
  departureAvailableStartTime: Date;
  departureAvailableEndTime: Date;
  createAt?: Date;
  updateAt?: Date;
};

export class PotCreateEventV1 implements PotEvent<PotCreateEventV1Dto> {
  private constructor(
    potRoomPk: string,
    timestamp: Date,
    data: PotCreateEventV1Dto,
  ) {
    this.potRoomPk = potRoomPk;
    this.eventType = "create_v1";
    this.timestamp = timestamp;
    this.data = {
      potRoomPk: data.potRoomPk,
      name: data.name,
      createUserId: data.createUserId,
      routePk: data.routePk,
      maxCapacity: data.maxCapacity,
      // convert str to Date
      departureAvailableStartTime: parseDate(data.departureAvailableStartTime),
      departureAvailableEndTime: parseDate(data.departureAvailableEndTime),
      createAt: parseDate(data.createAt),
      updateAt: parseDate(data.updateAt),
    };
    this.dispatcher = PotCreateEventV1.getDispatcherFunction();
  }

  static generatePotCreateEvent(
    potRoomPk: string,
    timestamp: Date,
    data: PotCreateEventV1Dto,
  ) {
    return new PotCreateEventV1(potRoomPk, timestamp, data);
  }

  private static getDispatcherFunction(): (
    pot: Pot,
    data: PotCreateEventV1Dto,
  ) => Pot {
    return (pot: Pot, data: PotCreateEventV1Dto, validation?: boolean) => {
      const now = new Date();

      if (validation) {
        AssertIfValidDepartureAvailableTime(
          data.departureAvailableStartTime,
          data.departureAvailableEndTime,
        );

        AssertIfValidCapacity(data.maxCapacity);
      }

      pot.pk = data.potRoomPk;

      pot.hostUserPk = data.createUserId;
      pot.joinedUserPks.push(data.createUserId);
      pot.loggedUserPks.push(data.createUserId);
      pot.name = data.name;
      pot.routePk = data.routePk;

      pot.maxCapacity = data.maxCapacity;
      pot.departureAvailableStartTime = data.departureAvailableStartTime;
      pot.departureAvailableEndTime = data.departureAvailableEndTime;

      pot.createAt = data.createAt || now;
      pot.updateAt = data.updateAt || now;

      pot.departureTime = null;
      pot.isArchived = false;

      return pot;
    };
  }

  readonly potRoomPk: string;
  readonly eventType: PotEventStringType;
  readonly timestamp: Date;
  readonly data: PotCreateEventV1Dto;
  readonly dispatcher: (room: Pot, data: PotCreateEventV1Dto) => Pot;
}
