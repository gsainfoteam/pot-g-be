import type { Pot } from "@src/pot/model/pot";
import { potEvent, PotEventStringType } from "drizzle/schema/pot-event";
import { PotCreateEventV1, PotCreateEventV1Dto } from "./pot-create-event";
import { PotUserInEventV1, PotUserInEventV1Dto } from "./pot-user-in-event";
import {
  PotDepartureConfirmEventV1,
  PotDepartureConfirmEventV1Dto,
} from "./pot-departure-confirm-event";
import {
  PotUserKickEventV1,
  PotUserKickEventV1Dto,
} from "./pot-user-kick-event";
import { PotArchiveEventV1, PotArchiveEventV1Dto } from "./pot-archive-event";
import {
  PotUserLeaveEventV1,
  PotUserLeaveEventV1Dto,
} from "./pot-user-leave-event";
import {
  PotAccountingConfirmEventV1,
  PotAccountingConfirmEventV1Dto,
} from "./pot-accounting-confirm-event";
import {
  PotAccountingRequestEventV1,
  PotAccountingRequestEventV1Dto,
} from "./pot-accounting-request-event";
import {
  PotChatEventV1,
  PotChatEventV1Dto,
} from "@src/pot/event/pot-chat-event";

export interface PotEvent<T> {
  //Metadata of event
  potRoomPk: string;
  eventType: PotEventStringType;
  timestamp: Date;

  //RealData of Event
  data: T;
  dispatcher: (room: Pot, data: T) => Pot;
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
        const data = entity.data as PotCreateEventV1Dto;
        return PotCreateEventV1.generatePotCreateEvent(
          entity.potFk,
          entity.timestamp,
          data,
        );
      }
      case "chat_v1": {
        const data = entity.data as PotChatEventV1Dto;
        return PotChatEventV1.generatePotChatEvent(
          entity.potFk,
          entity.timestamp,
          data,
        );
      }
      case "user_in_v1": {
        const data = entity.data as PotUserInEventV1Dto;
        return PotUserInEventV1.generatePotUserInEvent(
          entity.potFk,
          entity.timestamp,
          data,
        );
      }
      case "departure_confirm_v1": {
        const data = entity.data as PotDepartureConfirmEventV1Dto;
        return PotDepartureConfirmEventV1.generatePotDepartureConfirmEvent(
          entity.potFk,
          entity.timestamp,
          data,
        );
      }
      case "user_kick_v1": {
        const data = entity.data as PotUserKickEventV1Dto;
        return PotUserKickEventV1.generatePotUserKickEvent(
          entity.potFk,
          entity.timestamp,
          data,
        );
      }
      case "archive_v1": {
        const data = entity.data as PotArchiveEventV1Dto;
        return PotArchiveEventV1.generatePotArchiveEvent(
          entity.potFk,
          entity.timestamp,
          data,
        );
      }
      case "user_leave_v1": {
        const data = entity.data as PotUserLeaveEventV1Dto;
        return PotUserLeaveEventV1.generatePotUserLeaveEvent(
          entity.potFk,
          entity.timestamp,
          data,
        );
      }
      case "accounting_confirm_v1": {
        const data = entity.data as PotAccountingConfirmEventV1Dto;
        return PotAccountingConfirmEventV1.generatePotAccountingConfirmEvent(
          entity.potFk,
          entity.timestamp,
          data,
        );
      }
      case "accounting_request_v1": {
        const data = entity.data as PotAccountingRequestEventV1Dto;
        return PotAccountingRequestEventV1.generatePotAccountingRequestEvent(
          entity.potFk,
          entity.timestamp,
          data,
        );
      }
    }
  }
}
