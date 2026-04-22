/**
 * FileName: approval-engine.service.ts
 * Description: Service for the approval engine feature. Handles business logic for
 *              approval levels, actors, and request approvals.
 * Authors: DebugStudio Team
 * Last Modification: 
 * 21/04/2026 [Julio Rodríguez] Created approval engine service scaffold
 */

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApprovalLevel } from './entities/approval-level.entity';
import { ApprovalLevelActor } from './entities/approval-level-actor.entity';
import { RequestApproval } from './entities/request-approval.entity';

@Injectable()
export class ApprovalEngineService {
  constructor(
    @InjectRepository(ApprovalLevel)
    private readonly approvalLevelRepository: Repository<ApprovalLevel>,

    @InjectRepository(ApprovalLevelActor)
    private readonly approvalLevelActorRepository: Repository<ApprovalLevelActor>,

    @InjectRepository(RequestApproval)
    private readonly requestApprovalRepository: Repository<RequestApproval>,
  ) {}
}