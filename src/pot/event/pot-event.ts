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
import {
  PotPopoChatEventV1,
  PotPopoChatEventV1Schema,
} from "@src/pot/event/v1/pot-popo-chat-event";

export interface PotEvent<S, D> {
  //Metadata of event
  potRoomPk: string;
  eventType: PotEventStringType;
  timestamp: Date;

  //RealData of Event
  data: S;
  dispatcher(pot: Pot, data: S): Pot;
  validate(pot: Pot, data: S): void;
  toDto(): D;
}

export type PotEventEntityInsert = typeof potEvent.$inferInsert;
export type PotEventEntitySelect = typeof potEvent.$inferSelect;

export class PotEventFactory {
  static toEntity(event: PotEvent<any, any>): PotEventEntityInsert {
    return {
      potFk: event.potRoomPk,
      timestamp: event.timestamp,
      type: event.eventType,
      data: event.data,
    };
  }

  static toModel(entity: PotEventEntitySelect): PotEvent<any, any> {
    switch (entity.type) {
      case "create_v1": {
        return PotCreateEventV1.generatePotCreateEvent(
          entity.potFk,
          entity.timestamp,
          entity.data as PotCreateEventV1Schema,
        );
      }
      case "chat_v1": {
        return PotChatEventV1.generatePotChatEvent(
          entity.potFk,
          entity.timestamp,
          entity.data as PotChatEventV1Schema,
        );
      }
      case "user_in_v1": {
        return PotUserInEventV1.generatePotUserInEvent(
          entity.potFk,
          entity.timestamp,
          entity.data as PotUserInEventV1Schema,
        );
      }
      case "departure_confirm_v1": {
        return PotDepartureConfirmEventV1.generatePotDepartureConfirmEvent(
          entity.potFk,
          entity.timestamp,
          entity.data as PotDepartureConfirmEventV1Schema,
        );
      }
      case "user_kick_v1": {
        return PotUserKickEventV1.generatePotUserKickEvent(
          entity.potFk,
          entity.timestamp,
          entity.data as PotUserKickEventV1Schema,
        );
      }
      case "archive_v1": {
        return PotArchiveEventV1.generatePotArchiveEvent(
          entity.potFk,
          entity.timestamp,
          entity.data as PotArchiveEventV1Schema,
        );
      }
      case "user_leave_v1": {
        return PotUserLeaveEventV1.generatePotUserLeaveEvent(
          entity.potFk,
          entity.timestamp,
          entity.data as PotUserLeaveEventV1Schema,
        );
      }
      case "accounting_confirm_v1": {
        return PotAccountingConfirmEventV1.generatePotAccountingConfirmEvent(
          entity.potFk,
          entity.timestamp,
          entity.data as PotAccountingConfirmEventV1Schema,
        );
      }
      case "accounting_request_v1": {
        return PotAccountingRequestEventV1.generatePotAccountingRequestEvent(
          entity.potFk,
          entity.timestamp,
          entity.data as PotAccountingRequestEventV1Schema,
        );
      }
      case "popo_chat_v1": {
        return PotPopoChatEventV1.generateEvent(
          entity.potFk,
          entity.timestamp,
          entity.data as PotPopoChatEventV1Schema,
        );
      }
    }
  }
}
