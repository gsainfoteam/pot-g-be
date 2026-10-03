import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { ManagerContext } from "@src/auth/context/manager-context.entity";
import { AdminAccountRole } from "@src/admin-database/entity/admin-account.entity";

/**
 * ManagerGuard 뒤에 붙여서 사용합니다. superadmin 권한을 가진 매니저만 통과시킵니다.
 */
@Injectable()
export class SuperAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const managerCtx: ManagerContext = req.user;

    if (!managerCtx || managerCtx.role !== AdminAccountRole.superadmin) {
      throw new ForbiddenException("superadmin 권한이 필요합니다.");
    }

    return true;
  }
}
