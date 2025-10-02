import { Pot } from "../model/pot";
import type { PotEvent } from "./pot-event";

export class PotEventReducer {
  static reduce<T>(pot: Pot, event: PotEvent<T>, validation?: boolean): Pot {
    return event.dispatcher(pot, event.data, validation);
  }

  static reduceAll(
    pot: Pot,
    events: PotEvent<any>[],
    validation?: boolean,
  ): Pot {
    return events.reduce((currentRoom, event) => {
      return event.dispatcher(currentRoom, event.data, validation);
    }, pot);
  }

  static reduceFromInitial(events: PotEvent<any>[], validation?: boolean): Pot {
    return PotEventReducer.reduceAll(new Pot(), events, validation);
  }
}
