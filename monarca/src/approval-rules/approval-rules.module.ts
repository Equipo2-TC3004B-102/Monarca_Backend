/**
 * FileName: approval-rules.module.ts
 * Description: Module for approval rules. Registers GuardsModule so the controller
 *              can use AuthGuard, PermissionsGuard, and CompanyAdminGuard.
 * Authors: DebugStudio Team
 * Last Modification:
 * 03/05/2026 [Julio Rodriguez] Added GuardsModule import to support guard injection in controller.
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApprovalLevel } from 'src/approval-engine/entities/approval-level.entity';
import { ApprovalRulesController } from './approval-rules.controller';
import { ApprovalRulesService } from './approval-rules.service';
import { GuardsModule } from 'src/guards/guards.module';

@Module({
  imports: [TypeOrmModule.forFeature([ApprovalLevel]), GuardsModule],
  controllers: [ApprovalRulesController],
  providers: [ApprovalRulesService],
})
export class ApprovalRulesModule {}
