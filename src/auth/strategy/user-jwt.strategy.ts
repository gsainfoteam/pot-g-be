import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { UserAccessTokenJwtPayload } from "@src/auth/jwt/user-jwt.payload";
import { UserContext } from "@src/auth/context/user-context.entity";

@Injectable()
export class UserJwtStrategy extends PassportStrategy(Strategy, "user-jwt") {
  constructor(publicKey: string | Buffer) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      algorithms: ["RS256"],
      secretOrKey: publicKey,
    });
  }

  async validate(payload: UserAccessTokenJwtPayload): Promise<UserContext> {
    return new UserContext(payload.userId, payload.devicePk);
  }
}
