/**
 * FileName: request-logs.service.ts
 * Description: Service handling request log business logic. Provides read operations
 *              against the request_logs table. Throws NotFoundException when a
 *              log entry is not found by ID.
 * Authors: Original Monarca team
 * Last Modification made:
 * 25/02/2026 [Sergio Jiawei Xuan] Added detailed comments and documentation for clarity and maintainability.
 */

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateRequestLogDto } from './dto/create-request-log.dto';
import { UpdateRequestLogDto } from './dto/update-request-log.dto';
import { RequestLog } from './entities/request-log.entity';

@Injectable()
export class RequestLogsService {
  constructor(
    @InjectRepository(RequestLog)
    private readonly repo: Repository<RequestLog>,
  ) {}

  async findAll(): Promise<RequestLog[]> {
    return this.repo.find();
  }

  async findOne(id: string): Promise<RequestLog> {
    const ent = await this.repo.findOneBy({ id });
    if (!ent) throw new NotFoundException(`Log ${id} not found`);
    return ent;
  }
}
