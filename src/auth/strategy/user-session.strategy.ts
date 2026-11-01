import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy } from "passport-http-bearer";
import { UserContext } from "@src/auth/context/user-context.entity";
import { UserAccountService } from "@src/auth/account";

@Injectable()
export class UserSessionStrategy extends PassportStrategy(
  Strategy,
  "user-session",
) {
  constructor(private readonly account: UserAccountService) {
    super();
  }

  async validate(token: string): Promise<UserContext | false> {
    const session = await this.account.verifySession(token);
    return session ? new UserContext(session.sub, session.devicePk) : false;
  }
}
