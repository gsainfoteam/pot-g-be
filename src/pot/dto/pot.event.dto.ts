import { PotEventDto } from "@src/pot/event/v1/dto/pot-event.dto";
import { IsNumber, Max, Min } from "class-validator";
import { Type } from "class-transformer";

export class PotEventListReqDto {
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(50)
  limit: number = 20;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  starts_from: number;
}

export class PotEventListResDto {
  events: PotEventDto<any>[];
}
