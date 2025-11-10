import { Injectable, Logger } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { UserEntity } from "@src/database/entity/user.entity";
import { KeyPairService } from "@src/keypair/key-pair.service";
import { StringValue } from "ms";
import { ManagerAccessTokenJwtPayload } from "@src/auth/jwt/manager-jwt.payload";

@Injectable()
export class ManagerAuthService {
  private readonly logger = new Logger(ManagerAuthService.name);
  private readonly accessTokenExpiresIn: StringValue = "1d";

  constructor(
    private readonly jwtService: JwtService,
    private readonly keyPairService: KeyPairService,
  ) {}

  async createNewJwtToken(user: UserEntity) {
    const payload: ManagerAccessTokenJwtPayload = {
      email: user.email,
    };

    const { privateKey } = await this.keyPairService.getKeyPair();

    const accessToken = this.jwtService.sign(payload, {
      issuer: "PotG-Manager",
      algorithm: "RS256",
      privateKey: privateKey,
      expiresIn: this.accessTokenExpiresIn,
    });

    return {
      accessToken,
    };
  }
}
