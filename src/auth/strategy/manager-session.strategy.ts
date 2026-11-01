import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy } from "passport-http-bearer";
import { ManagerContext } from "@src/auth/context/manager-context.entity";
import { AdminAccountRepository } from "@src/admin-database/repository/admin-account.repository";
import { ManagerAccountService } from "@src/auth/account";

@Injectable()
export class ManagerSessionStrategy extends PassportStrategy(
  Strategy,
  "manager-session",
) {
  constructor(
    private readonly account: ManagerAccountService,
    private readonly adminAccountRepository: AdminAccountRepository,
  ) {
    super();
  }

  async validate(token: string): Promise<ManagerContext | false> {
    const session = await this.account.verifySession(token);
    if (!session) {
      return false;
    }

    // 세션 발급 이후 권한이 바뀌거나 계정이 제거될 수 있으므로, role 은 세션이 아니라 DB 의 현재 값을 사용합니다.
    const adminAccount = await this.adminAccountRepository.findByEmail(
      session.sub,
    );
    if (!adminAccount) {
      throw new UnauthorizedException();
    }

    return new ManagerContext(adminAccount.email, adminAccount.role);
  }
}
