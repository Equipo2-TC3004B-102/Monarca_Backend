import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApprovalLevel } from 'src/approval-engine/entities/approval-level.entity';
import { CreateApprovalRuleDto } from './dto/approval-rule.dto';

@Injectable()
export class ApprovalRulesService {
  constructor(
    @InjectRepository(ApprovalLevel)
    private readonly repo: Repository<ApprovalLevel>,
  ) {}

  findAll(): Promise<ApprovalLevel[]> {
    return this.repo.find({ order: { level_order: 'ASC' } });
  }

  create(dto: CreateApprovalRuleDto): Promise<ApprovalLevel> {
    const ent = this.repo.create(dto);
    return this.repo.save(ent);
  }
}
