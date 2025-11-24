export class RefreshTokenEntity {
  opaqueHash: string;
  refreshToken: string;
  createdAt?: Date;
  updatedAt?: Date;
  expiresAt: Date;
}
