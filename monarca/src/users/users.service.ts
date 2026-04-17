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
}
