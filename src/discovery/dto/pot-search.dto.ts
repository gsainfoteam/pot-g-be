import {
  IsDate,
  IsNumber,
  IsOptional,
  IsUUID,
  Max,
  Min,
} from "class-validator";
import { Transform, Type } from "class-transformer";
import { parseSeoulDate } from "@src/global/utils/convert-date";

export class PotSearchDto {
  @IsOptional()
  @IsUUID()
  route_id?: string;

  @IsOptional()
  @IsDate()
  @Transform(({ value }) => parseSeoulDate(value))
  starts_at?: Date;

  @IsOptional()
  @IsDate()
  @Transform(({ value }) => parseSeoulDate(value))
  ends_at?: Date;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  offset: number = 0;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit: number = 20;
}
