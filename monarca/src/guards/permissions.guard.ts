/**
 * permissions.guard.ts
 * Description: NestJS guard that implements permission-based authorization. After
 * authentication (AuthGuard), this guard loads the full user from the database including
 * their role and permissions. It attaches userInfo and userPermissions to the request
 * object, then checks whether the user has all permissions required by the route handler
 * (declared via the @Permissions decorator). Throws ForbiddenException if the user
 * lacks required permissions.
 * Authors: Original Monarca team
 * Last Modification made:
 * 25/02/2026 [Juan Pablo Narchi Capote] Added detailed comments and documentation for clarity and maintainability.
 */

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from './decorators/permission.decorator';
import { Repository } from 'typeorm';
import { User } from 'src/users/entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { SessionInfoInterface } from './interfaces/sessionInfo.interface';
import { UserInfoInterface } from './interfaces/userInfo.interface';
import { RequestInterface } from './interfaces/request.interface';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    @InjectRepository(User)
    private userRepository123: Repository<User>,
  ) {}

  /**
   * canActivate, loads the user with their role and permissions from the database,
   * attaches user info to the request, and verifies that the user has all required
   * permissions for the route handler.
   * Input: context (ExecutionContext) - the NestJS execution context containing the HTTP request.
   * Output: boolean - true if the user has all required permissions, throws ForbiddenException otherwise.
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestInterface>();

    const userId = request.sessionInfo?.id;
    if (!userId) throw new ForbiddenException('User session not found');

    const user = await this.findById(userId);
    if (!user || !user.role || !user.role.permissions) {
      throw new ForbiddenException('User or permissions not found');
    }

    // console.log('User found:', user.id);

    request.sessionInfo.id = user.id;
    request.userInfo = {
      id: user.id,
      email: user.email,
      name: user.name,
      last_name: user.last_name,
      status: user.status,
      id_department: user.id_department,
      id_role: user.id_role,
      id_travel_agency: user.id_travel_agency,
    };
    // console.log(`request.sessionInfo.id: ${request.sessionInfo.id}`)

    const userPermissions = user.role.permissions.map((p) => p.name);
    request.userPermissions = userPermissions;

    const permissionsRequired = this.reflector.get<string[]>(
      PERMISSIONS_KEY,
      context.getHandler(),
    );

    if (!permissionsRequired) return true;

    const hasPermission = permissionsRequired.every((permission) =>
      userPermissions.includes(permission),
    );

    if (!hasPermission) {
      throw new ForbiddenException('Permission denied');
    }

    return true;
  }

  /**
   * findById, retrieves a user by their ID including their role and permissions relations.
   * Input: id (string) - the UUID of the user.
   * Output: User entity with role and permissions loaded; throws ForbiddenException if not found.
   */
  async findById(id: string): Promise<User> {
    const user = await this.userRepository123.findOne({
      where: { id },
      relations: ['role', 'role.permissions'],
    });

    if (!user) {
      throw new ForbiddenException('User not found');
    }

    return user;
  }
}
