import {
  IsDate,
  IsNumber,
  IsOptional,
  IsUUID,
  Max,
  Min,
} from "class-validator";
import { parseISO } from "date-fns";
import { Transform } from "class-transformer";

export class PotSearchDto {
  @IsOptional()
  @IsUUID()
  route_id?: string;

  @IsOptional()
  @IsDate()
  @Transform(({ value }) => parseISO(value))
  starts_at?: Date;

  @IsOptional()
  @IsDate()
  @Transform(({ value }) => parseISO(value))
  ends_at?: Date;

  @IsNumber()
  @Min(0)
  offset: number = 0;

  @IsNumber()
  @Min(1)
  @Max(100)
  limit: number = 20;
}
