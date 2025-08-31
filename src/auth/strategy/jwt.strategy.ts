import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { AccessTokenJwtPayload } from "@src/auth/jwt.payload";
import { UserContext } from "@src/auth/user-context.entity";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(publicKey: string | Buffer) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      algorithms: ["RS256"],
      secretOrKey: publicKey,
    });
  }

  async validate(payload: AccessTokenJwtPayload): Promise<UserContext> {
    return new UserContext(payload.userId, payload.deviceId);
  }
}
