import { Injectable, UnauthorizedException } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";

@Injectable()
export class ManagerGuard extends AuthGuard("manager-jwt") {
  handleRequest(err: any, user: any, info: any, _) {
    if (err || !user) {
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

    return user;
  }
}
