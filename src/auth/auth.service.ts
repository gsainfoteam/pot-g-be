import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { UserEntity } from "@src/user/model/user.entity";
import { AccessTokenJwtPayload } from "@src/auth/jwt.payload";
import { JwtKeyPairRepository } from "@src/auth/jwt-key-pair.repository";

@Injectable()
export class AuthService {
  private jwtPublicKey: string;
  private jwtPrivateKey: string;
  private readonly accessTokenExpiresIn: string = "6h";
  private readonly refreshTokenExpiresIn: string = "30d";

  constructor(
    private readonly jwtService: JwtService,
    private readonly jwtKeyPairRepository: JwtKeyPairRepository,
  ) {}

  async getKeyPair() {
    if (!this.jwtPublicKey || !this.jwtPrivateKey) {
      const { publicKey, privateKey } =
        await this.jwtKeyPairRepository.getKeyPair();
      this.jwtPublicKey = publicKey;
      this.jwtPrivateKey = privateKey;
    }
    return {
      publicKey: this.jwtPublicKey,
      privateKey: this.jwtPrivateKey,
    };
  }

  async createNewJwtToken(user: UserEntity) {
    const payload: AccessTokenJwtPayload = {
      userId: user.pk,
      deviceId: "default",
    };

    const accessToken = this.jwtService.sign(payload, {
      privateKey: this.jwtPrivateKey,
      expiresIn: this.accessTokenExpiresIn,
    });

    const refreshToken = this.jwtService.sign(payload, {
      privateKey: this.jwtPrivateKey,
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
      return this.jwtService.verify<AccessTokenJwtPayload>(refreshToken, {
        publicKey: this.jwtPublicKey,
      });
    } catch (e) {
      console.error("Invalid refresh token:", e);
      return null; // Invalid token
    }
  }

  async refreshAccessToken(user: UserEntity) {
    const payload: AccessTokenJwtPayload = {
      userId: user.pk,
      deviceId: "default",
    };

    const accessToken = this.jwtService.sign(payload, {
      privateKey: this.jwtPrivateKey,
      expiresIn: this.accessTokenExpiresIn,
    });

    return {
      accessToken,
    };
  }
}
