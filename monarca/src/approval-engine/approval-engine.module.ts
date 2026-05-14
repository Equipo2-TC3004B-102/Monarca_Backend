/**
 * FileName: approval-engine.module.ts
 * Description: NestJS module for the approval engine feature. Registers entities,
 *              service, and controller for approval levels, actors, and request approvals.
 *              Also registers admin service and controller for company and user management.
 * Authors: DebugStudio Team
 * Last Modification made:
 * 13/05/2026 [Julio Rodriguez] Added CostCenter to forFeature for CECO listing endpoint.
 *                              Added Request entity to forFeature for request reassignment on level deletion.
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApprovalLevel } from './entities/approval-level.entity';
import { ApprovalLevelActor } from './entities/approval-level-actor.entity';
import { RequestApproval } from './entities/request-approval.entity';
import { ApprovalEngineService } from './approval-engine.service';
import { ApprovalEngineController } from './approval-engine.controller';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { GuardsModule } from 'src/guards/guards.module';
import { Company } from 'src/companies/entity/company.entity';
import { User } from 'src/users/entities/user.entity';
import { Request as RequestEntity } from 'src/requests/entities/request.entity';
import { CostCenter } from 'src/cost-centers/entity/cost-centers.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ApprovalLevel,
      ApprovalLevelActor,
      RequestApproval,
      Company,
      User,
      RequestEntity,
      CostCenter,
    ]),
    GuardsModule,
  ],
  controllers: [ApprovalEngineController, AdminController],
  providers: [ApprovalEngineService, AdminService],
  exports: [ApprovalEngineService, AdminService],
})
export class ApprovalEngineModule {}