import { Pot } from "../model/pot";
import type { PotEvent } from "./pot-event";

export class PotEventReducer {
  static reduce<S, D>(
    pot: Pot,
    event: PotEvent<S, D>,
    validation?: boolean,
  ): Pot {
    if (validation) {
      event.validate(pot, event.data);
    }
    return event.dispatcher(pot, event.data);
  }

  static reduceAll(
    pot: Pot,
    events: PotEvent<any, any>[],
    validation?: boolean,
  ): Pot {
    if (validation) {
      return events.reduce((currentRoom, event) => {
        event.validate(currentRoom, event.data);
        return event.dispatcher(currentRoom, event.data);
      }, pot);
    } else {
      return events.reduce((currentRoom, event) => {
        return event.dispatcher(currentRoom, event.data);
      }, pot);
    }
  }

  static reduceFromInitial(
    events: PotEvent<any, any>[],
    validation?: boolean,
  ): Pot {
    return PotEventReducer.reduceAll(new Pot(), events, validation);
  }
}
