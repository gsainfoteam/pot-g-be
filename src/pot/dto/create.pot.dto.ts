import { Transform } from "class-transformer";
import { parseISO } from "date-fns";

export class CreatePotReqDto {
  route_id: string;
  @Transform(({ value }) => parseISO(value))
  starts_at: Date;
  @Transform(({ value }) => parseISO(value))
  ends_at: Date;
  max_count: number;
}

export class CreatePotResDto {
  id: string;
}
