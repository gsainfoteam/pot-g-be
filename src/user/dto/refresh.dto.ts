import { ApiProperty } from "@nestjs/swagger";
export class RefreshRequestDto {
  @ApiProperty({ type: String })
  refresh_token: string;
}

export class RefreshResponseDto {
  @ApiProperty({ type: String })
  access_token: string;
}
