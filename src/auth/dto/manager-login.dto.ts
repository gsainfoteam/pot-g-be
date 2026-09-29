export class ManagerLoginRequestDto {
  code: string;
  redirect_uri: string;
}

export class ManagerLoginResponseDto {
  access_token: string;
}
