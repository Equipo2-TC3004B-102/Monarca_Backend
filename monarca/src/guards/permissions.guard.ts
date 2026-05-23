/**
 * FileName: permissions.guard.ts
 * Description: Guard for enforcing user permissions on protected routes. Derives
 *              permissions from user boolean flags via FLAG_PERMISSIONS map —
 *              no runtime DB join to roles_permissions required.
 * Authors: Original Monarca team
 * Last Modification made:
 * 19/05/2026 [Julio Rodriguez] Added new flag for travel agent reservations history.
 */

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  BadRequestException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from './decorators/permission.decorator';
import { Repository } from 'typeorm';
import { User } from 'src/users/entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { RequestInterface } from './interfaces/request.interface';

// Map of user boolean flags to their corresponding permissions. Used to derive a user's permissions based on their flags without needing a DB join to roles_permissions.
export const FLAG_PERMISSIONS: Record<string, string[]> = {
  is_requester: ['create_request', 'edit_request', 'delete_request', 'upload_vouchers', 'view_own_requests'],
  is_approver: [
    'approve_request',
    'deny_request',
    'request_changes',
    'view_approved_request_history',
  ],
  is_soi: ['check_budgets', 'approve_budget', 'deny_budget', 'assign_request_to_travel_agency', 'approve_vouchers', 'deny_vouchers', 'view_assigned_requests_readonly'],
  is_travelAgent: ['view_assigned_requests_readonly', 'submit_reservations', 'send_reservation_receipts', 'view_travel_agent_history'],
  is_company_admin: [
    'create_cost_center',
    'read_cost_center',
    'update_cost_center',
    'delete_cost_center',
  ],
};

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  /**
   * canActivate, evaluates whether the current request is authorized.
   * Loads the user from DB, attaches userInfo and userPermissions to the request,
   * then checks required permissions from the route decorator. System admins bypass all checks.
   * Input: context (ExecutionContext) from NestJS interceptor chain.
   * Output: true when authorized, throws BadRequestException when not.
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestInterface>();

    const userId = request.sessionInfo?.id;
    if (!userId) throw new BadRequestException('User session not found');

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new BadRequestException('User not found');
    }

    request.sessionInfo.id = user.id;
    request.userInfo = {
      id: user.id,
      email: user.email,
      name: user.name,
      last_name: user.last_name,
      status: user.status,
      id_ceco: user.id_ceco,
      id_travel_agency: user.id_travel_agency,
      id_company: user.id_company,
      manager_id: user.manager_id,
      is_system_admin: user.is_system_admin,
      is_first_login: user.is_first_login,
      is_requester: user.is_requester,
      is_approver: user.is_approver,
      is_soi: user.is_soi,
      is_travelAgent: user.is_travelAgent,
      is_company_admin: user.is_company_admin,
    };

    const userPermissions = Object.entries(FLAG_PERMISSIONS)
      .filter(([flag]) => user[flag as keyof User])
      .flatMap(([, perms]) => perms);

    request.userPermissions = userPermissions;

    const permissionsRequired = this.reflector.get<string[]>(
      PERMISSIONS_KEY,
      context.getHandler(),
    );

    if (!permissionsRequired) return true;

    // System admins bypass all permission checks — they have access to every business endpoint.
    if (user.is_system_admin) return true;

    const hasPermission = permissionsRequired.some((permission) =>
      userPermissions.includes(permission),
    );

    if (!hasPermission) {
      throw new BadRequestException('Permission denied');
    }

    return true;
  }
}
