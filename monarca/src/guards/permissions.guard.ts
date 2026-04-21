/**
 * FileName: permissions.guard.ts
 * Description: Guard for enforcing user permissions on protected routes. Checks
 *              if the authenticated user has the required permissions defined
 *              by endpoint metadata.
 * Authors: Original Monarca team
 * Last Modification made:
 * 11/04/2026 [Julio Rodriguez] Standardized client error handling to BadRequestException for HTTP 400 policy and aligned header documentation.
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

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    @InjectRepository(User)
    private userRepository123: Repository<User>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestInterface>();

    const userId = request.sessionInfo?.id;
    if (!userId) throw new BadRequestException('User session not found');

    const user = await this.findById(userId);
    if (!user || !user.role || !user.role.permissions) {
      throw new BadRequestException('User or permissions not found');
    }

    // console.log('User found:', user.id);

    request.sessionInfo.id = user.id;
    request.userInfo = {
      id: user.id,
      email: user.email,
      name: user.name,
      last_name: user.last_name,
      status: user.status,
      id_ceco: user.id_ceco,
      id_role: user.id_role,
      id_travel_agency: user.id_travel_agency,
      id_company: user.id_company, // Added company ID to userInfo for access control based on company association
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
      throw new BadRequestException('Permission denied');
    }

    return true;
  }

  async findById(id: string): Promise<User> {
    const user = await this.userRepository123.findOne({
      where: { id },
      relations: ['role', 'role.permissions'],
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    return user;
  }
}
