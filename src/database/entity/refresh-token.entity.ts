export class RefreshTokenEntity {
  tokenHmac: string;
  refreshToken: string;
  createdAt?: Date;
  updatedAt?: Date;
}
