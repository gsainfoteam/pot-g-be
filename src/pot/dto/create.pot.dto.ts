import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { parseSeoulDate } from "@src/global/utils/convert-date";
import { BaseResultDto } from "@src/global/dto/base-result.dto";

export class CreatePotReqDto {
  @ApiProperty({ type: String })
  route_id: string;
  @ApiProperty({
    type: Date,
    description: "출발 가능 시작 시간. 시간대가 포함된 ISO 8601 문자열",
    example: "2026-11-15T10:00:00+09:00",
  })
  @Transform(({ value }) => parseSeoulDate(value))
  starts_at: Date;
  @ApiProperty({
    type: Date,
    description: "출발 가능 종료 시간",
    example: "2026-11-15T11:00:00+09:00",
  })
  @Transform(({ value }) => parseSeoulDate(value))
  ends_at: Date;
  @ApiProperty({
    type: Number,
    minimum: 2,
    maximum: 4,
    example: 4,
    description: "최대 탑승 인원",
  })
  max_count: number;
}

export class CreatePotResDto extends BaseResultDto {
  @ApiPropertyOptional({ type: String })
  id?: string;
}
