import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class LogoutRequestDto {
  @IsOptional()
  @IsNotEmpty()
  @IsString()
  refresh_token?: string;
}
