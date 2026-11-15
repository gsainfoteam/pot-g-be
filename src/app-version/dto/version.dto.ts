import { ApiProperty } from "@nestjs/swagger";
export class VersionDto {
  @ApiProperty({ type: String })
  ios_min_version: string;
  @ApiProperty({ type: String })
  ios_latest_version: string;
  @ApiProperty({ type: String })
  aos_min_version: string;
  @ApiProperty({ type: String })
  aos_latest_version: string;
}
