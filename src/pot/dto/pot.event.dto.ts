import { ApiPropertyOptional, ApiProperty } from "@nestjs/swagger";
import { PotEventDto } from "@src/pot/event/v1/dto/pot-event.dto";
import { IsNumber, IsOptional, Max, Min } from "class-validator";
import { Type } from "class-transformer";

export class PotEventListReqDto {
  @ApiPropertyOptional({ type: Number, default: 20, minimum: 0, maximum: 50 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(50)
  limit: number = 20;

  @ApiPropertyOptional({
    type: Number,
    minimum: 0,
    description: "이 시각 이후 이벤트 조회. Unix timestamp (초)",
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  starts_from?: number;

  @ApiPropertyOptional({
    type: Number,
    minimum: 0,
    description: "중복 제거할 마지막 수신 이벤트 ID",
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  except?: number;
}

export class PotEventListResDto {
  @ApiProperty({ type: () => PotEventDto, isArray: true })
  events: PotEventDto<any>[];
}
