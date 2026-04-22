/**
 * FileName: approval-engine.module.ts
 * Description: NestJS module for the approval engine feature. Registers entities,
 *              service, and controller for approval levels, actors, and request approvals.
 * Authors: DebugStudio Team
 * Last Modification: 
 * 21/04/2026 [Julio Rodríguez] Created approval engine module scaffold
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApprovalLevel } from './entities/approval-level.entity';
import { ApprovalLevelActor } from './entities/approval-level-actor.entity';
import { RequestApproval } from './entities/request-approval.entity';
import { ApprovalEngineService } from './approval-engine.service';
import { ApprovalEngineController } from './approval-engine.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([ApprovalLevel, ApprovalLevelActor, RequestApproval]),
  ],
  controllers: [ApprovalEngineController],
  providers: [ApprovalEngineService],
  exports: [ApprovalEngineService],
})
export class ApprovalEngineModule {}