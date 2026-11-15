import { ApiProperty } from "@nestjs/swagger";
export class SetDeviceInfoRequestDto {
  @ApiProperty({ type: String })
  fcm_token: string;
  @ApiProperty({ type: String })
  os: string;
  @ApiProperty({ type: String })
  version: string;
}
