import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ConfigService } from "@nestjs/config";
import { ExtractJwt, Strategy } from "passport-jwt";
import { AccessTokenJwtPayload } from "@src/auth/jwt.payload";
import { UserContext } from "@src/auth/user-context.entity";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromHeader("access-token"),
      algorithms: ["RS256"],
      secretOrKey: configService.get<string>("PUBLIC_KEY"),
    });
  }

  async validate(payload: AccessTokenJwtPayload): Promise<UserContext> {
    return new UserContext(payload.userId, payload.deviceId);
  }
}
