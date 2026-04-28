/**
 * FileName: users.service.ts
 * Description: Service handling user business logic. Provides CRUD operations
 *              against the users table. Throws BadRequestException when a user
 *              is not found by ID, including findById internal lookups with
 *              role and permission relations.
 * Authors: Original Monarca team
 * Last Modification made:
 * 16/04/2026 [Julio Rodriguez] Added role handdler with flags for permissions for access certain resources, added company_id to separate users by company.
 */

import {
  BadRequestException,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { CreateUserDto, UpdateUserDto, UserDto } from './dto/user.dtos';
import { ImportUserDto } from './dto/import-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly repo: Repository<User>,
  ) {}

  async findById(id: string): Promise<User> {
    const user = await this.repo.findOne({
      where: { id },
      relations: ['role', 'role.permissions'],
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    return user;
  }

  async findAll(): Promise<UserDto[]> {
    return await this.repo.find();
  }

  // Added create, update and delete methods for user management
  async create(data: CreateUserDto): Promise<User> {
    const ent = this.repo.create({
      ...data,
      user_name: data.user_name ?? data.email.split('@')[0],
      creation_date: data.creation_date ?? new Date(),
    });

    return this.repo.save(ent);
  }

  async findOne(id: string): Promise<UserDto> {
    const ent = await this.repo.findOne({
      where: { id },
      relations: { travel_agency: true },
    });
    if (!ent) throw new BadRequestException(`User ${id} not found`);
    return ent;
  }

  async update(id: string, data: UpdateUserDto): Promise<UserDto> {
    await this.repo.update(id, data);

    return this.findOne(id);
  }

  async delete(id: string): Promise<{ status: boolean; message: string }> {
    await this.repo.delete(id);
    return { status: true, message: `User ${id} deleted` };
  }

  async importUsers(users: ImportUserDto[]): Promise<{ created: number; errors: string[] }> {
    const errors: string[] = [];
    let created = 0;
    const REQUESTER_ROLE_ID = 'b0d4211d-457e-4d84-b8a4-320af380683f';

    // Create users in batch, skipping those that fail and collecting errors
    for (const userData of users) {
      try { 
        const rawPassword = userData.employee_num ?? 'password';
        const hashedPassword = await bcrypt.hash(rawPassword, 10);
        const ent = this.repo.create({
          ...userData,
          last_name: '',
          password: hashedPassword,
          id_role: REQUESTER_ROLE_ID,
          is_requester: true,
          user_name: userData.user_name ?? userData.email.split('@')[0],
          creation_date: userData.creation_date ?? new Date(),
        });
        await this.repo.save(ent);
        created++;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        errors.push(`${userData.email}: ${message}`);
      }
    }

    // Users referenced as managers in the batch become approvers
    // Also assigns the Approver role — temporary until RBAC-to-flags migration is complete
    const APPROVER_ROLE_ID = '8f28d424-2d93-483a-9018-f568cf6bc13a';
    const managerIds = [...new Set(
      users.filter((u) => u.manager_id).map((u) => u.manager_id as string),
    )];
    for (const managerId of managerIds) {
      await this.repo.update(managerId, { is_approver: true, id_role: APPROVER_ROLE_ID });
    }

    return { created, errors };
  }
}
