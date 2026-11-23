import { Type } from "class-transformer";
import { IsInt, IsOptional, Max, Min } from "class-validator";

export class FofoStatusListReqDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  page: number = 0; // 0부터 시작

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  size: number = 10;
}

export type FofoReservationStatus = "scheduled" | "overdue";

export class FofoReservationDto {
  pk: string;
  pot_pk: string;
  pot_name: string;
  type: string;
  title: string;
  send_after: string;
  created_at: string;
  /** overdue means the send time has passed but the reservation is not processed yet. */
  status: FofoReservationStatus;
}

export class FofoReservationListResDto {
  items: FofoReservationDto[];
  total: number;
  page: number;
  size: number;
}

export class FofoSentDto {
  /** Part of the pot_event key (pot_pk, sent_at, event_id); not unique on its own. */
  event_id: number;
  pot_pk: string;
  pot_name: string;
  type: string;
  title: string;
  /** Message body with the variables already filled in. */
  content: string;
  action_btns: string[];
  sent_at: string;
}

export class FofoSentListResDto {
  items: FofoSentDto[];
  total: number;
  page: number;
  size: number;
}
