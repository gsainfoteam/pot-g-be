export class LoginRequestDto {
  token: string;
  device_id: string;
}

export class LoginResponseDto {
  access_token: string;
  refresh_token: string;
}
