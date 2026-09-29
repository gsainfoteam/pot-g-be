import { ForbiddenException, Injectable, Logger } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { KeyPairService } from "@src/keypair/key-pair.service";
import { StringValue } from "ms";
import { ManagerAccessTokenJwtPayload } from "@src/auth/jwt/manager-jwt.payload";
import { AdminAccountRole } from "@src/database/entity/admin-account.entity";
import { InfoteamIdpService } from "@lib/infoteam-idp";
import { AdminAccountRepository } from "@src/database/repository/admin-account.repository";

@Injectable()
export class ManagerAuthService {
  private readonly logger = new Logger(ManagerAuthService.name);
  private readonly accessTokenExpiresIn: StringValue = "1d";

  constructor(
    private readonly jwtService: JwtService,
    private readonly keyPairService: KeyPairService,
    private readonly infoteamIdpService: InfoteamIdpService,
    private readonly adminAccountRepository: AdminAccountRepository,
  ) {}

  async login(code: string, redirectUri: string, codeVerifier: string) {
    const idpAccessToken =
      await this.infoteamIdpService.exchangeAuthorizationCode(
        code,
        redirectUri,
        codeVerifier,
      );
    const { email } =
      await this.infoteamIdpService.validateAccessToken(idpAccessToken);

    const adminAccount = await this.adminAccountRepository.findByEmail(email);
    if (!adminAccount) {
      throw new ForbiddenException("허용되지 않은 관리자 계정입니다.");
    }

    return this.createNewJwtToken(email, adminAccount.role);
  }

  async createNewJwtToken(email: string, role: AdminAccountRole) {
    if (!email.endsWith("@gistory.me")) {
      throw new ForbiddenException();
    }
    const payload: ManagerAccessTokenJwtPayload = {
      email: email,
      role: role,
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
