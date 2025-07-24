import { Pot } from "../model/pot";
import type { PotEvent } from "./pot-event";

export class PotEventReducer {
  static reduce<T>(pot: Pot, event: PotEvent<T>): Pot {
    return event.dispatcher(pot, event.data);
  }

  static reduceAll(pot: Pot, events: PotEvent<any>[]): Pot {
    return events.reduce((currentRoom, event) => {
      return event.dispatcher(currentRoom, event.data);
    }, pot);
  }

  static reduceFromInitial(events: PotEvent<any>[]): Pot {
    return PotEventReducer.reduceAll(new Pot(), events);
  }
}
