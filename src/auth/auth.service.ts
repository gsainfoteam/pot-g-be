import { Injectable, Logger } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { UserEntity } from "@src/database/entity/user.entity";
import { AccessTokenJwtPayload } from "@src/auth/jwt.payload";
import { KeyPairService } from "@src/keypair/key-pair.service";
import { DeviceEntity } from "@src/database/entity/device.entity";
import { RefreshTokenRepository } from "@src/database/repository/refresh-token.repository";
import { RefreshTokenEntity } from "@src/database/entity/refresh-token.entity";
import { TxType } from "@src/global/types/tx.types";
import { createHash, getRandomValues } from "node:crypto";

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

    const hash = await this.createCSPRNHash(refreshToken, tx);

    return {
      accessToken,
      refreshToken: hash,
    };
  }

  private async createCSPRNHash(refreshToken: string, tx: TxType) {
    const randomNumberArray = new Uint32Array(16);
    getRandomValues(randomNumberArray);
    // 좀 긴 문자열을 만들고 싶은 의도로 hash 를 생성하는 것이지 위변조를 검증하기 위함이 아니므로 추후 validate 시 hash 를 비교하지는 않습니다.
    const hash = createHash("sha256").update(randomNumberArray).digest("hex");

    const refreshTokenEntity: RefreshTokenEntity = {
      opaqueHash: hash,
      refreshToken: refreshToken,
    };
    await this.refreshTokenRepository.insert(refreshTokenEntity, tx);

    return hash;
  }

  async validateOpaqueHash(
    opaqueHash: string,
  ): Promise<AccessTokenJwtPayload | null> {
    try {
      const { publicKey } = await this.keyPairService.getKeyPair();

      const refreshTokenEntity =
        await this.refreshTokenRepository.findByOpaqueHash(opaqueHash);

      if (!refreshTokenEntity) {
        // TODO
        this.logger.error("Refresh token not found");
        return null; // Invalid token
      }

      return this.jwtService.verify<AccessTokenJwtPayload>(
        refreshTokenEntity.refreshToken,
        {
          publicKey: publicKey,
        },
      );
    } catch (e) {
      // TODO
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
      // TODO
      console.error("Invalid refresh token:", e);
      return null; // Invalid token
    }
  }
}
