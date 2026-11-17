import { sql } from "drizzle-orm";
import { potRoom } from "../../../drizzle/schema/pot-room";

export function getPotDepartureTime() {
  return sql<
    string | null
  >`(SELECT (pe.data->>'departureTime')::timestamptz FROM pot_event AS pe WHERE pe.pot_fk = ${potRoom.pk} AND pe.type = 'departure_confirm_v1' ORDER BY pe.timestamp DESC, pe.id DESC LIMIT 1)`;
}
