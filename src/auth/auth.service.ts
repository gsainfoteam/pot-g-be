import { Injectable, Logger } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { UserEntity } from "@src/database/entity/user.entity";
import { AccessTokenJwtPayload } from "@src/auth/jwt.payload";
import { KeyPairService } from "@src/keypair/key-pair.service";
import { DeviceEntity } from "@src/database/entity/device.entity";
import { RefreshTokenRepository } from "@src/database/repository/refresh-token.repository";
import { RefreshTokenEntity } from "@src/database/entity/refresh-token.entity";
import { TxType } from "@src/global/types/tx.types";
import { createSign, createVerify } from "node:crypto";

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly accessTokenExpiresIn: string = "6h";
  private readonly refreshTokenExpiresIn: string = "30d";

  constructor(
    private readonly jwtService: JwtService,
    private readonly keyPairService: KeyPairService,
    private readonly refreshTokenRepository: RefreshTokenRepository,
  ) {}

  async createNewJwtToken(user: UserEntity, device: DeviceEntity, tx: TxType) {
    const payload: AccessTokenJwtPayload = {
      userId: user.pk,
      devicePk: device.pk,
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

    const signature = await this.createSignatureRefreshToken(refreshToken, tx);

    return {
      accessToken,
      refreshToken: signature,
    };
  }

  private async createSignatureRefreshToken(refreshToken: string, tx: TxType) {
    const { privateKey } = await this.keyPairService.getKeyPair();

    const sign = createSign("RSA-SHA256");
    sign.update(refreshToken);
    sign.end();

    const signature = sign.sign(privateKey, "base64");

    const refreshTokenEntity: RefreshTokenEntity = {
      tokenSignature: signature,
      refreshToken: refreshToken,
    };
    await this.refreshTokenRepository.insert(refreshTokenEntity, tx);

    return signature;
  }

  async validateRefreshToken(
    refreshTokenSignature: string,
  ): Promise<AccessTokenJwtPayload | null> {
    try {
      const { publicKey } = await this.keyPairService.getKeyPair();

      const refreshTokenEntity =
        await this.refreshTokenRepository.findByTokenSignature(
          refreshTokenSignature,
        );

      if (!refreshTokenEntity) {
        this.logger.error("Refresh token not found");
        return null; // Invalid token
      }

      const verify = createVerify("RSA-SHA256");
      verify.update(refreshTokenEntity.refreshToken);
      verify.end();

      if (
        !verify.verify(publicKey, refreshTokenEntity.tokenSignature, "base64")
      ) {
        this.logger.error("Refresh token signature mismatch");
        return null; // Invalid token
      }

      return this.jwtService.verify<AccessTokenJwtPayload>(
        refreshTokenEntity.refreshToken,
        {
          publicKey: publicKey,
        },
      );
    } catch (e) {
      console.error("Invalid refresh token:", e);
      return null; // Invalid token
    }
  }

  async refreshAccessToken(user: UserEntity, devicePk: string) {
    const payload: AccessTokenJwtPayload = {
      userId: user.pk,
      devicePk: devicePk,
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

  async validateAccessToken(accessToken: string) {
    try {
      const { publicKey } = await this.keyPairService.getKeyPair();

      const payload = this.jwtService.verify<AccessTokenJwtPayload>(
        accessToken,
        {
          publicKey: publicKey,
        },
      );
      const decoded = this.jwtService.decode(accessToken) as {
        exp: number;
      };
      const validUntil = new Date(decoded.exp * 1000);

      return {
        ...payload,
        validUntil,
      };
    } catch (e) {
      console.error("Invalid refresh token:", e);
      return null; // Invalid token
    }
  }
}
