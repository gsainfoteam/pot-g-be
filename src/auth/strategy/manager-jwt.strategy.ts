import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { ManagerAccessTokenJwtPayload } from "@src/auth/jwt/manager-jwt.payload";
import { ManagerContext } from "@src/auth/context/manager-context.entity";
import { AdminAccountRepository } from "@src/admin-database/repository/admin-account.repository";

@Injectable()
export class ManagerJwtStrategy extends PassportStrategy(
  Strategy,
  "manager-jwt",
) {
  constructor(
    publicKey: string | Buffer,
    private readonly adminAccountRepository: AdminAccountRepository,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      algorithms: ["RS256"],
      secretOrKey: publicKey,
      issuer: "PotG-Manager",
    });
  }

  async validate(
    payload: ManagerAccessTokenJwtPayload,
  ): Promise<ManagerContext> {
    // 토큰 발급 이후 권한이 바뀌거나 계정이 제거될 수 있으므로, role 은 토큰이 아니라 DB 의 현재 값을 사용합니다.
    const adminAccount = await this.adminAccountRepository.findByEmail(
      payload.email.trim().toLowerCase(),
    );
    if (!adminAccount) {
      throw new UnauthorizedException();
    }

    return new ManagerContext(adminAccount.email, adminAccount.role);
  }
}
