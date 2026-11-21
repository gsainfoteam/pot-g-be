import { IsBoolean, IsInt, Max, Min,} from "class-validator";

export class UpdateDelayCheckPolicyDto {
  @IsBoolean()
  enabled: boolean;

  @IsInt()
  @Min(1)
  @Max(2147483647)
  minutes_before_departure: number;
}