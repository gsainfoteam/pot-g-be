import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { ManagerContext } from "@src/auth/context/manager-context.entity";

export const GetManager = createParamDecorator(
  (data, ctx: ExecutionContext): ManagerContext => {
    const req = ctx.switchToHttp().getRequest();
    const managerCtx: ManagerContext = req.user;
    if (!managerCtx) {
      throw new Error("Manager context is not available in the request");
    }
    return managerCtx;
  },
);
