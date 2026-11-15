import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsUUID, Length } from "class-validator";

export class ReportUserReqDto {
  @ApiProperty({ type: String, format: "uuid" })
  @IsUUID()
  report_target_id: string;

  @ApiProperty({ type: String })
  @IsNotEmpty()
  @Length(0, 500)
  reason: string;
}
