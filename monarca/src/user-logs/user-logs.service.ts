/**
 * FileName: user-logs.service.ts
 * Description: Service handling user log business logic. Provides CRUD operations
 *              against the user_logs table.
 * Authors: Original Monarca team
 * Last Modification made:
 * 21/05/2026 [Julio Rodríguez] Added service to handle user logs for auditing purposes across the application, including login/logout actions and request status changes. This service will be used by other modules like AuthModule and RequestsModule to create log entries.
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

  /**
   * findByCompany — Returns all audit logs for users belonging to a company, ordered by date descending.
   * Input: companyId (string).
   * Output: UserLogs array with user name and email populated.
   */
  findByCompany(companyId: string): Promise<UserLogs[]> {
    return this.userLogsRepository
      .createQueryBuilder('log')
      .leftJoin('log.user', 'user')
      .addSelect(['user.id', 'user.name', 'user.last_name', 'user.email'])
      .where('user.id_company = :companyId', { companyId })
      .orderBy('log.date', 'DESC')
      .getMany();
  }
}
