/**
 * FileName: approval-rules.controller.ts
 * Description: Controller for approval rules endpoints. Restricted to company admins
 *              and system admins via AuthGuard → PermissionsGuard → CompanyAdminGuard.
 * Authors: DebugStudio Team
 * Last Modification:
 * 03/05/2026 [Julio Rodriguez] Added AuthGuard, PermissionsGuard, CompanyAdminGuard to restrict rules to company admins.
 */

import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApprovalRulesService } from './approval-rules.service';
import { CreateApprovalRuleDto } from './dto/approval-rule.dto';
import { AuthGuard } from 'src/guards/auth.guard';
import { PermissionsGuard } from 'src/guards/permissions.guard';
import { CompanyAdminGuard } from 'src/guards/company-admin.guard';

@UseGuards(AuthGuard, PermissionsGuard, CompanyAdminGuard)
@Controller('rules')
export class ApprovalRulesController {
  constructor(private readonly service: ApprovalRulesService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Post()
  create(@Body() dto: CreateApprovalRuleDto) {
    return this.service.create(dto);
  }
}
