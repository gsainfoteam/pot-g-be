import type { Room } from "@src/pot/model/room";
import { generateRoomId } from "@src/utils/id-generate";
import { roomEvent } from "drizzle/schema/room-event";
import { RoomCreateEventV1, RoomCreateEventV1Dto } from "./room-create-event";
import { RoomJoinEventV1, RoomJoinEventV1Dto } from "./room-join-event";
import {
  RoomDepartureConfirmEventV1,
  RoomDepartureConfirmEventV1Dto,
} from "./room-departure-confirm-event";
import {
  RoomUserKickEventV1,
  RoomUserKickEventV1Dto,
} from "./room-user-kick-event";
import {
  RoomArchiveEventV1,
  RoomArchiveEventV1Dto,
} from "./room-archive-event";
import { RoomLeaveEventV1, RoomLeaveEventV1Dto } from "./room-leave-event";
import {
  RoomSendPaymentConfirmEventV1,
  RoomSendPaymentConfirmEventV1Dto,
} from "./room-send-payemnt-confirm-event";
import {
  RoomSetRecipientEventV1,
  RoomSetRecipientEventV1Dto,
} from "./room-set-recipient-event";

export interface RoomEvent<T> {
  //Metadata of event
  eventType: string;

  //RealData of Event
  data: T;
  timestamp: Date;
  dispatcher: (room: Room, data: T) => Room;
}

export type RoomEventEntityInsert = typeof roomEvent.$inferInsert;
export type RoomEventEntitySelect = typeof roomEvent.$inferSelect;

export class RoomEventFactory {
  static generateRoomEventId(): string {
    return generateRoomId("ROOM_EVENT");
  }

  static toEntity(room: Room, event: RoomEvent<any>): RoomEventEntityInsert {
    return {
      id: this.generateRoomEventId(),
      roomId: room.roomId,
      eventType: event.eventType,
      data: event.data,
      timestamp: event.timestamp,
    };
  }

  static toModel(entity: RoomEventEntitySelect): RoomEvent<any> {
    switch (entity.eventType) {
      case "RoomCreateEventV1": {
        const data = entity.data as RoomCreateEventV1Dto;
        return RoomCreateEventV1.generateRoomCreateEvent(data);
      }
      case "RoomJoinEventV1": {
        const data = entity.data as RoomJoinEventV1Dto;
        return RoomJoinEventV1.generateRoomJoinEvent(data);
      }
      case "RoomDepartureConfirmEventV1": {
        const data = entity.data as RoomDepartureConfirmEventV1Dto;
        return RoomDepartureConfirmEventV1.generateRoomDepartureConfirmEvent(
          data,
        );
      }
      case "RoomUserKickEventV1": {
        const data = entity.data as RoomUserKickEventV1Dto;
        return RoomUserKickEventV1.generateRoomUserKickEvent(data);
      }
      case "RoomArchiveEventV1": {
        const data = entity.data as RoomArchiveEventV1Dto;
        return RoomArchiveEventV1.generateRoomArchiveEvent(data);
      }
      case "RoomLeaveEventV1": {
        const data = entity.data as RoomLeaveEventV1Dto;
        return RoomLeaveEventV1.generateRoomLeaveEvent(data);
      }
      case "RoomSendPaymentConfirmEventV1": {
        const data = entity.data as RoomSendPaymentConfirmEventV1Dto;
        return RoomSendPaymentConfirmEventV1.generateRoomSendPaymentConfirmEvent(
          data,
        );
      }
      case "RoomSetRecipientEventV1": {
        const data = entity.data as RoomSetRecipientEventV1Dto;
        return RoomSetRecipientEventV1.generateRoomSetRecipientEvent(data);
      }
      default:
        throw new Error(`Unknown event type: ${entity.eventType}`);
    }
  }
}
