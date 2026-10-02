import { IsOptional, IsString, Matches } from "class-validator";

const VERSION_PATTERN = /^\d+\.\d+\.\d+$/;
const VERSION_MESSAGE = "version must be in the form of x.y.z";

export class VersionUpdateDto {
  @IsOptional()
  @IsString()
  @Matches(VERSION_PATTERN, { message: VERSION_MESSAGE })
  ios_min_version?: string;

  @IsOptional()
  @IsString()
  @Matches(VERSION_PATTERN, { message: VERSION_MESSAGE })
  ios_latest_version?: string;

  @IsOptional()
  @IsString()
  @Matches(VERSION_PATTERN, { message: VERSION_MESSAGE })
  aos_min_version?: string;

  @IsOptional()
  @IsString()
  @Matches(VERSION_PATTERN, { message: VERSION_MESSAGE })
  aos_latest_version?: string;
}
