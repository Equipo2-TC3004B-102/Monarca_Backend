/**
 * FileName: user-logs.service.ts
 * Description: Service handling user log business logic. Provides CRUD operations
 *              against the user_logs table.
 * Authors: Original Monarca team
 * Last Modification made:
 * 25/02/2026 [Sergio Jiawei Xuan] Added detailed comments and documentation for clarity and maintainability.
 */

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserLogs } from './entity/user-logs.entity';
import { CreateUserLogDto } from './dto/create-user-log.dto';
import { UpdateUserLogDto } from './dto/update-user-log.dto';

@Injectable()
export class UserLogsService {
  constructor(
    @InjectRepository(UserLogs)
    private readonly userLogsRepository: Repository<UserLogs>,
  ) {}

  create(dto: CreateUserLogDto) {
    const log = this.userLogsRepository.create(dto);
    return this.userLogsRepository.save(log);
  }

  findAll() {
    return this.userLogsRepository.find();
  }

  findOne(id: string) {
    return this.userLogsRepository.findOne({ where: { id } });
  }

  update(id: string, dto: UpdateUserLogDto) {
    return this.userLogsRepository.update(id, dto);
  }

  remove(id: string) {
    return this.userLogsRepository.delete(id);
  }
}
