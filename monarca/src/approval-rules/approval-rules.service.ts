/**
 * FileName: approval-rules.service.ts
 * Description: Service for the /rules endpoints. Thin wrapper around ApprovalLevel CRUD.
 *              Company admins are scoped to their own company; system admins see all.
 * Authors: DebugStudio Team
 * Last Modification made:
 * 05/05/2026 [Julio Rodriguez] Added caller scoping — company_id derived from JWT, not request body.
 */

import { ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApprovalLevel } from 'src/approval-engine/entities/approval-level.entity';
import { CreateApprovalRuleDto } from './dto/approval-rule.dto';
import { UserInfoInterface } from 'src/guards/interfaces/userInfo.interface';

@Injectable()
export class ApprovalRulesService {
  constructor(
    @InjectRepository(ApprovalLevel)
    private readonly repo: Repository<ApprovalLevel>,
  ) {}

  /**
   * findAll, returns all approval rules visible to the caller.
   * System admins see all; company admins see only their company's rules.
   * Input: caller (UserInfoInterface) from JWT.
   * Output: ApprovalLevel array ordered by level_order ascending.
   */
  findAll(caller: UserInfoInterface): Promise<ApprovalLevel[]> {
    if (caller.is_system_admin) {
      return this.repo.find({ order: { level_order: 'ASC' } });
    }
    return this.repo.find({
      where: { company_id: caller.id_company ?? undefined },
      order: { level_order: 'ASC' },
    });
  }

  /**
   * create, creates a new approval rule scoped to the caller's company.
   * Throws ForbiddenException when caller has no associated company.
   * Input: dto (CreateApprovalRuleDto) with rule data, caller (UserInfoInterface) from JWT.
   * Output: created ApprovalLevel entity.
   */
  create(dto: CreateApprovalRuleDto, caller: UserInfoInterface): Promise<ApprovalLevel> {
    if (!caller.id_company) {
      throw new ForbiddenException({
        message: 'Cannot create approval rules without a company',
        code: 'APPROVAL_RULES_FORBIDDEN_COMPANY',
      });
    }
    const ent = this.repo.create({ ...dto, company_id: caller.id_company });
    return this.repo.save(ent);
  }
}
