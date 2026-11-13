import { ApiProperty } from "@nestjs/swagger";
export class LoginRequestDto {
  @ApiProperty({ type: String, description: "Infoteam IDP 인증 토큰" })
  token: string;
  @ApiProperty({
    type: String,
    description: "로그인 기기 식별자",
    example: "device-123",
  })
  device_id: string;
}

export class LoginResponseDto {
  @ApiProperty({ type: String })
  access_token: string;
  @ApiProperty({ type: String })
  refresh_token: string;
}
