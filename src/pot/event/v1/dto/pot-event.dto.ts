export class PotEventDto<T> {
  pot_pk: string;
  timestamp: number;
  id: number;
  event_type: string;
  data: T;
}
