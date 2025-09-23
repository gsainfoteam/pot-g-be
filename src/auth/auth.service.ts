import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { UserEntity } from "@src/user/model/user.entity";
import { AccessTokenJwtPayload } from "@src/auth/jwt.payload";
import { KeyPairService } from "@src/keypair/key-pair.service";
import { DeviceEntity } from "@src/user/model/device.entity";

@Injectable()
export class AuthService {
  private readonly accessTokenExpiresIn: string = "6h";
  private readonly refreshTokenExpiresIn: string = "30d";

  constructor(
    private readonly jwtService: JwtService,
    private readonly keyPairService: KeyPairService,
  ) {}

  async createNewJwtToken(user: UserEntity, device: DeviceEntity) {
    const payload: AccessTokenJwtPayload = {
      userId: user.pk,
      deviceId: device.pk,
    };

    const { privateKey } = await this.keyPairService.getKeyPair();

    const accessToken = this.jwtService.sign(payload, {
      issuer: "PotG",
      algorithm: "RS256",
      privateKey: privateKey,
      expiresIn: this.accessTokenExpiresIn,
    });

    const refreshToken = this.jwtService.sign(payload, {
      issuer: "PotG",
      algorithm: "RS256",
      privateKey: privateKey,
      expiresIn: this.refreshTokenExpiresIn,
    });

    return {
      accessToken,
      refreshToken,
    };
  }

  async validateRefreshToken(
    refreshToken: string,
  ): Promise<AccessTokenJwtPayload | null> {
    try {
      const { publicKey } = await this.keyPairService.getKeyPair();

      return this.jwtService.verify<AccessTokenJwtPayload>(refreshToken, {
        publicKey: publicKey,
      });
    } catch (e) {
      console.error("Invalid refresh token:", e);
      return null; // Invalid token
    }
  }

  async refreshAccessToken(user: UserEntity, deviceId: string) {
    const payload: AccessTokenJwtPayload = {
      userId: user.pk,
      deviceId: deviceId,
    };

    const { privateKey } = await this.keyPairService.getKeyPair();

    const accessToken = this.jwtService.sign(payload, {
      issuer: "PotG",
      algorithm: "RS256",
      privateKey: privateKey,
      expiresIn: this.accessTokenExpiresIn,
    });

    return {
      accessToken,
    };
  }
}
