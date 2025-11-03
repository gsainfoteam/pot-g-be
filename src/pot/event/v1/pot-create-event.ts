import { PotEventStringType } from "../../../../drizzle/schema/pot-event";
import { PotEvent } from "@src/pot/event/pot-event";
import { Pot } from "@src/pot/model/pot";
import {
  AssertIfValidCapacity,
  AssertIfValidDepartureAvailableTime,
} from "@src/pot/validator/common-pot-validator";
import { parseSeoulDate } from "@src/global/utils/convertDate";
import { PotEventCreateV1Dto } from "@src/pot/event/v1/dto/pot-event.create.v1.dto";

export type PotCreateEventV1Schema = {
  potRoomPk: string;
  name: string;
  createUserId: string;
  routePk: string;
  maxCapacity: number;
  departureAvailableStartTime: Date;
  departureAvailableEndTime: Date;
  createAt: Date;
  updateAt: Date;
};

export class PotCreateEventV1
  implements PotEvent<PotCreateEventV1Schema, PotEventCreateV1Dto>
{
  private constructor(
    potRoomPk: string,
    timestamp: Date,
    data: PotCreateEventV1Schema,
    id?: number,
  ) {
    this.potRoomPk = potRoomPk;
    this.eventType = "create_v1";
    this.timestamp = timestamp;
    this.data = data;
    this.data.departureAvailableStartTime = parseSeoulDate(
      data.departureAvailableStartTime,
    );
    this.data.departureAvailableEndTime = parseSeoulDate(
      data.departureAvailableEndTime,
    );
    this.data.createAt = parseSeoulDate(data.createAt);
    this.data.updateAt = parseSeoulDate(data.updateAt);
    this.id = id;
  }

  static generatePotCreateEvent(
    potRoomPk: string,
    timestamp: Date,
    data: PotCreateEventV1Schema,
    id?: number,
  ) {
    return new PotCreateEventV1(potRoomPk, timestamp, data, id);
  }

  dispatcher(pot: Pot, data: PotCreateEventV1Schema): Pot {
    const now = new Date();

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
  }

  validate(pot: Pot, data: PotCreateEventV1Schema) {
    AssertIfValidDepartureAvailableTime(
      data.departureAvailableStartTime,
      data.departureAvailableEndTime,
    );

    AssertIfValidCapacity(data.maxCapacity);
  }

  toDto(): PotEventCreateV1Dto {
    return {
      created_by: this.data.createUserId,
    };
  }

  readonly potRoomPk: string;
  readonly eventType: PotEventStringType;
  readonly timestamp: Date;
  readonly data: PotCreateEventV1Schema;
  readonly id?: number; // DB 에서 자동 생성됨.
}
