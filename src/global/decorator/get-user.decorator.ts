import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { UserContext } from "@src/auth/user-context.entity";

export const GetUser = createParamDecorator(
  (ctx: ExecutionContext): UserContext => {
    const req = ctx.switchToHttp().getRequest();
    const userCtx: UserContext = req.user;
    if (!userCtx) {
      throw new Error("User context is not available in the request");
    }
    return userCtx;
  },
);
