import { Injectable, UnauthorizedException } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";

// user-jwt 는 SDK 이전 앱이 받은 토큰입니다. 구 버전 앱이 강제 업데이트로 사라지면 user-session 만 남깁니다.
@Injectable()
export class UserGuard extends AuthGuard(["user-session", "user-jwt"]) {
  handleRequest(err: any, user: any, info: any, _) {
    if (err || !user) {
      // 전략이 여럿이면 info 는 전략별 실패 이유의 배열입니다.
      const reason = [info].flat().find((i) => i?.name);
      console.log(`Authentication failed:`, {
        error: err?.message,
        info: reason?.message || info,
        user: user,
      });

      if (reason?.name === "TokenExpiredError") {
        throw new UnauthorizedException("Token expired");
      }
      if (reason?.name === "JsonWebTokenError") {
        throw new UnauthorizedException("Invalid token");
      }
      if (reason?.name === "NotBeforeError") {
        throw new UnauthorizedException("Token not active");
      }

      throw new UnauthorizedException("Authentication failed");
    }

    return user;
  }
}
