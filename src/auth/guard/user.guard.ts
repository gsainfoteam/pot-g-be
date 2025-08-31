import { Injectable, UnauthorizedException } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";

@Injectable()
export class UserGuard extends AuthGuard("jwt") {
  handleRequest(err: any, user: any, info: any, _) {
    if (err || !user) {
      console.log(`Authentication failed:`, {
        error: err?.message,
        info: info?.message || info,
        user: user,
      });

      if (info?.name === "TokenExpiredError") {
        throw new UnauthorizedException("Token expired");
      }
      if (info?.name === "JsonWebTokenError") {
        throw new UnauthorizedException("Invalid token");
      }
      if (info?.name === "NotBeforeError") {
        throw new UnauthorizedException("Token not active");
      }

      throw new UnauthorizedException("Authentication failed");
    }

    console.log(`Authentication successful for user: ${JSON.stringify(user)}`);
    return user;
  }
}
