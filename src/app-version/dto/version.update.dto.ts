import { IsOptional } from "class-validator";

export class VersionUpdateDto {
  @IsOptional()
  ios_min_version?: string;
  @IsOptional()
  ios_latest_version?: string;
  @IsOptional()
  aos_min_version?: string;
  @IsOptional()
  aos_latest_version?: string;
}
