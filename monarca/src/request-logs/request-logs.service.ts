/**
 * FileName: request-logs.service.ts
 * Description: Service handling request log business logic. Provides read operations
 *              against the request_logs table. Throws BadRequestException when a
 *              log entry is not found by ID.
 * Authors: Original Monarca team
 * Last Modification made:
 * 27/05/2026 [Julio Rodriguez] Added findByRequest to retrieve all logs for a given request.
 */

import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
    if (!ent) throw new BadRequestException(`Log ${id} not found`);
    return ent;
  }

  async findByRequest(requestId: string): Promise<RequestLog[]> {
    return this.repo.find({
      where: { id_request: requestId },
      relations: ['user'],
      order: { change_date: 'ASC' },
    });
  }
}
