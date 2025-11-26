import { IsNotEmpty, IsUUID, Length } from "class-validator";

export class ReportUserReqDto {
  @IsUUID()
  report_target_id: string;

  @IsNotEmpty()
  @Length(0, 500)
  reason: string;
}
