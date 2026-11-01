import { ForbiddenException, Injectable } from "@nestjs/common";
import { AdminAccountRepository } from "@src/admin-database/repository/admin-account.repository";
import { Trace } from "@gsainfoteam/nest-observability";
import { ManagerIdpUser } from "@src/auth/account";

@Trace()
@Injectable()
export class ManagerAuthService {
  constructor(
    private readonly adminAccountRepository: AdminAccountRepository,
  ) {}

  async resolveSession(user: ManagerIdpUser) {
    const email = user.email.trim().toLowerCase();
    if (!email.endsWith("@gm.gist.ac.kr")) {
      throw new ForbiddenException();
    }

    const adminAccount = await this.adminAccountRepository.findByEmail(email);
    if (!adminAccount) {
      throw new ForbiddenException("This account is not allowed as a manager.");
    }

    return { subject: email };
  }
}
