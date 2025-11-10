import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { ManagerAccessTokenJwtPayload } from "@src/auth/jwt/manager-jwt.payload";
import { ManagerContext } from "@src/auth/context/manager-context.entity";

@Injectable()
export class ManagerJwtStrategy extends PassportStrategy(
  Strategy,
  "manager-jwt",
) {
  constructor(publicKey: string | Buffer) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      algorithms: ["RS256"],
      secretOrKey: publicKey,
    });
  }

  async validate(
    payload: ManagerAccessTokenJwtPayload,
  ): Promise<ManagerContext> {
    return new ManagerContext(payload.email);
  }
}
