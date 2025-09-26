export class PotEventDto<T> {
  pot_pk: string;
  timestamp: number;
  event_type: string;
  data: T;
}
