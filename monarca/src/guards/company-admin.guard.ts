/**
 * FileName: company-admin.guard.ts
 * Description: Guard that restricts access to company administrators.
 *              Reads userInfo populated by PermissionsGuard and checks the is_company_admin flag.
 *              System admins bypass this guard (they can access any company).
 *              When a companyId route param is present, verifies it matches the user's own company.
 *              Must be used after AuthGuard and PermissionsGuard in the guard chain.
 * Authors: DebugStudio Team
 * Last Modification: 22/04/2026 [Julio Rodríguez] Created CompanyAdminGuard for flag-based authorization.
 */

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { RequestInterface } from './interfaces/request.interface';

@Injectable()
export class CompanyAdminGuard implements CanActivate {
  /**
   * canActivate - Verifies the user is a company admin or system admin.
   *              If the user is a company admin (not system admin), also verifies
   *              the companyId route param matches the user's own company.
   * Input: context ExecutionContext
   * Output: true if authorized, throws ForbiddenException otherwise
   */
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<RequestInterface>();
    const user = request.userInfo;

    if (!user?.is_company_admin && !user?.is_system_admin) {
      throw new ForbiddenException({
        message: 'Access restricted to company administrators',
        code: 'AUTH_FORBIDDEN_NOT_COMPANY_ADMIN',
      });
    }

    if (user.is_system_admin) {
      return true;
    }

    const targetCompanyId =
      (request as any).params?.companyId ??
      (request as any).params?.company_id;

    if (targetCompanyId && user.id_company !== targetCompanyId) {
      throw new ForbiddenException({
        message: 'Access restricted to administrators of this company',
        code: 'AUTH_FORBIDDEN_WRONG_COMPANY',
      });
    }

    return true;
  }
}
