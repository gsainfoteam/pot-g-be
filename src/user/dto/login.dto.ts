export class LoginRequestDto {
  token: string;
}

export class LoginResponseDto {
  access_token: string;
  refresh_token: string;
}
