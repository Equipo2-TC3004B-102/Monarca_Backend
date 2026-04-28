/**
 * FileName: system-admin.guard.ts
 * Description: Guard that restricts access to system administrators.
 *              Reads userInfo populated by PermissionsGuard and checks the is_system_admin flag.
 *              Must be used after AuthGuard and PermissionsGuard in the guard chain.
 * Authors: DebugStudio Team
 * Last Modification: 22/04/2026 [Julio Rodríguez] Created SystemAdminGuard for flag-based for system admin authorization for Ditta Users.
 */

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { RequestInterface } from './interfaces/request.interface';

@Injectable()
export class SystemAdminGuard implements CanActivate {
  /**
   * canActivate - Verifies the authenticated user has the is_system_admin flag set to true.
   * Input: context ExecutionContext
   * Output: true if authorized, throws ForbiddenException otherwise
   */
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<RequestInterface>();
    const user = request.userInfo;

    if (!user?.is_system_admin) {
      throw new ForbiddenException({
        message: 'Access restricted to system administrators',
        code: 'AUTH_FORBIDDEN_NOT_SYSTEM_ADMIN',
      });
    }

    return true;
  }
}
