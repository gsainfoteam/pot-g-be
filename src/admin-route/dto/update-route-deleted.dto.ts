import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean } from "class-validator";

export class UpdateRouteDeletedRequestDto {
  @ApiProperty({ type: Boolean })
  @IsBoolean()
  is_deleted: boolean;
}
