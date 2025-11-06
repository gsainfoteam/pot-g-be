import { Transform } from "class-transformer";
import { parseSeoulDate } from "@src/global/utils/convert-date";
import { BaseResultDto } from "@src/global/dto/base-result.dto";

export class CreatePotReqDto {
  route_id: string;
  @Transform(({ value }) => parseSeoulDate(value))
  starts_at: Date;
  @Transform(({ value }) => parseSeoulDate(value))
  ends_at: Date;
  max_count: number;
}

export class CreatePotResDto extends BaseResultDto {
  id?: string;
}
