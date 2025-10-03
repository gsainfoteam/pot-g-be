import type { Pot } from "@src/pot/model/pot";
import { potEvent, PotEventStringType } from "drizzle/schema/pot-event";
import {
  PotCreateEventV1,
  PotCreateEventV1Schema,
} from "./v1/pot-create-event";
import {
  PotUserInEventV1,
  PotUserInEventV1Schema,
} from "./v1/pot-user-in-event";
import {
  PotDepartureConfirmEventV1,
  PotDepartureConfirmEventV1Schema,
} from "./v1/pot-departure-confirm-event";
import {
  PotUserKickEventV1,
  PotUserKickEventV1Schema,
} from "./v1/pot-user-kick-event";
import {
  PotArchiveEventV1,
  PotArchiveEventV1Schema,
} from "./v1/pot-archive-event";
import {
  PotUserLeaveEventV1,
  PotUserLeaveEventV1Schema,
} from "./v1/pot-user-leave-event";
import {
  PotAccountingConfirmEventV1,
  PotAccountingConfirmEventV1Schema,
} from "./v1/pot-accounting-confirm-event";
import {
  PotAccountingRequestEventV1,
  PotAccountingRequestEventV1Schema,
} from "./v1/pot-accounting-request-event";
import {
  PotChatEventV1,
  PotChatEventV1Schema,
} from "@src/pot/event/v1/pot-chat-event";

export interface PotEvent<T> {
  //Metadata of event
  potRoomPk: string;
  eventType: PotEventStringType;
  timestamp: Date;

  //RealData of Event
  data: T;
  dispatcher(pot: Pot, data: T): Pot;
  validate(pot: Pot, data: T): void;
}

export type PotEventEntityInsert = typeof potEvent.$inferInsert;
export type PotEventEntitySelect = typeof potEvent.$inferSelect;

export class PotEventFactory {
  static toEntity(event: PotEvent<any>): PotEventEntityInsert {
    return {
      potFk: event.potRoomPk,
      timestamp: event.timestamp,
      type: event.eventType,
      data: event.data,
    };
  }

  static toModel(entity: PotEventEntitySelect): PotEvent<any> {
    switch (entity.type) {
      case "create_v1": {
        const data = entity.data as PotCreateEventV1Schema;
        return PotCreateEventV1.generatePotCreateEvent(
          entity.potFk,
          entity.timestamp,
          data,
        );
      }
      case "chat_v1": {
        const data = entity.data as PotChatEventV1Schema;
        return PotChatEventV1.generatePotChatEvent(
          entity.potFk,
          entity.timestamp,
          data,
        );
      }
      case "user_in_v1": {
        const data = entity.data as PotUserInEventV1Schema;
        return PotUserInEventV1.generatePotUserInEvent(
          entity.potFk,
          entity.timestamp,
          data,
        );
      }
      case "departure_confirm_v1": {
        const data = entity.data as PotDepartureConfirmEventV1Schema;
        return PotDepartureConfirmEventV1.generatePotDepartureConfirmEvent(
          entity.potFk,
          entity.timestamp,
          data,
        );
      }
      case "user_kick_v1": {
        const data = entity.data as PotUserKickEventV1Schema;
        return PotUserKickEventV1.generatePotUserKickEvent(
          entity.potFk,
          entity.timestamp,
          data,
        );
      }
      case "archive_v1": {
        const data = entity.data as PotArchiveEventV1Schema;
        return PotArchiveEventV1.generatePotArchiveEvent(
          entity.potFk,
          entity.timestamp,
          data,
        );
      }
      case "user_leave_v1": {
        const data = entity.data as PotUserLeaveEventV1Schema;
        return PotUserLeaveEventV1.generatePotUserLeaveEvent(
          entity.potFk,
          entity.timestamp,
          data,
        );
      }
      case "accounting_confirm_v1": {
        const data = entity.data as PotAccountingConfirmEventV1Schema;
        return PotAccountingConfirmEventV1.generatePotAccountingConfirmEvent(
          entity.potFk,
          entity.timestamp,
          data,
        );
      }
      case "accounting_request_v1": {
        const data = entity.data as PotAccountingRequestEventV1Schema;
        return PotAccountingRequestEventV1.generatePotAccountingRequestEvent(
          entity.potFk,
          entity.timestamp,
          data,
        );
      }
    }
  }
}
