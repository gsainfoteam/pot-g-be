import { IsDate } from "class-validator";
import { Transform } from "class-transformer";
import { parseSeoulDate } from "@src/global/utils/convert-date";

export class ConfirmDepartureTimeDto {
  @IsDate()
  @Transform(({ value }) => parseSeoulDate(value))
  departure_time: Date;
}
