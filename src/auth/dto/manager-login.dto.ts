import { IsNotEmpty, IsString } from "class-validator";
import { AdminAccountRole } from "@src/database/entity/admin-account.entity";

export class ManagerLoginRequestDto {
  @IsString()
  @IsNotEmpty()
  code: string;

  @IsString()
  @IsNotEmpty()
  redirect_uri: string;

  @IsString()
  @IsNotEmpty()
  code_verifier: string;
}

export class ManagerLoginResponseDto {
  access_token: string;
}

export class ManagerMeResponseDto {
  email: string;
  role: AdminAccountRole;
}
