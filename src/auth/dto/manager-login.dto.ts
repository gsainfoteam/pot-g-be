import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";
import { AdminAccountRole } from "@src/admin-database/entity/admin-account.entity";

export class ManagerLoginRequestDto {
  @ApiProperty({ type: String, description: "IDP OAuth 인가 코드" })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({
    type: String,
    description: "OAuth 인가 요청에 사용한 redirect_uri",
    example: "http://localhost:3000/auth/callback",
  })
  @IsString()
  @IsNotEmpty()
  redirect_uri: string;

  @ApiProperty({ type: String, description: "OAuth PKCE code_verifier" })
  @IsString()
  @IsNotEmpty()
  code_verifier: string;
}

export class ManagerLoginResponseDto {
  @ApiProperty({ type: String })
  access_token: string;
}

export class ManagerMeResponseDto {
  @ApiProperty({ type: String })
  email: string;
  @ApiProperty({ enum: AdminAccountRole, enumName: "AdminAccountRole" })
  role: AdminAccountRole;
}
