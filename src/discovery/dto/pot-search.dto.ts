import { ApiPropertyOptional } from "@nestjs/swagger";
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
  @ApiPropertyOptional({ type: String, format: "uuid" })
  @IsOptional()
  @IsUUID()
  route_id?: string;

  @ApiPropertyOptional({ type: Date })
  @IsOptional()
  @IsDate()
  @Transform(({ value }) => parseSeoulDate(value))
  starts_at?: Date;

  @ApiPropertyOptional({ type: Date })
  @IsOptional()
  @IsDate()
  @Transform(({ value }) => parseSeoulDate(value))
  ends_at?: Date;

  @ApiPropertyOptional({ type: Number, default: 0, minimum: 0 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  offset: number = 0;

  @ApiPropertyOptional({ type: Number, default: 20, minimum: 1, maximum: 100 })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit: number = 20;
}
