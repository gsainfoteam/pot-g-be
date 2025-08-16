import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { InfoteamIdpService } from "@lib/infoteam-idp";
import { UserEntity } from "@src/user/model/user.entity";
import { AccessTokenJwtPayload } from "@src/auth/jwt.payload";

@Injectable()
export class AuthService {
  private readonly jwtPrivateKey: string;
  private readonly accessTokenExpiresIn: string = "6h";
  private readonly refreshTokenExpiresIn: string = "30d";

  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly infoteamIdpService: InfoteamIdpService,
  ) {}

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
}
