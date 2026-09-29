export class ManagerLoginRequestDto {
  code: string;
  redirect_uri: string;
  code_verifier: string;
}

export class ManagerLoginResponseDto {
  access_token: string;
}
