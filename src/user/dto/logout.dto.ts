import { IsNotEmpty, IsString } from "class-validator";

export class LogoutRequestDto {
  @IsNotEmpty()
  @IsString()
  refresh_token: string;
}
