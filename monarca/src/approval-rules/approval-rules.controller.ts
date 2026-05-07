/**
 * FileName: approval-rules.controller.ts
 * Description: Controller for approval rules endpoints. Restricted to company admins
 *              and system admins via AuthGuard → PermissionsGuard → CompanyAdminGuard.
 * Authors: DebugStudio Team
 * Last Modification made:
 * 05/05/2026 [Julio Rodriguez] Inject caller userInfo; pass to service for company scoping.
 */

import { Body, Controller, Get, Post, Request, UseGuards } from '@nestjs/common';
import { ApprovalRulesService } from './approval-rules.service';
import { CreateApprovalRuleDto } from './dto/approval-rule.dto';
import { AuthGuard } from 'src/guards/auth.guard';
import { PermissionsGuard } from 'src/guards/permissions.guard';
import { CompanyAdminGuard } from 'src/guards/company-admin.guard';
import { RequestInterface } from 'src/guards/interfaces/request.interface';

@UseGuards(AuthGuard, PermissionsGuard, CompanyAdminGuard)
@Controller('rules')
export class ApprovalRulesController {
  constructor(private readonly service: ApprovalRulesService) {}

  /**
   * findAll, returns all approval rules visible to the authenticated caller.
   * Input: req (RequestInterface) carrying userInfo from PermissionsGuard.
   * Output: ApprovalLevel array.
   */
  @Get()
  findAll(@Request() req: RequestInterface) {
    return this.service.findAll(req.userInfo);
  }

  /**
   * create, creates a new approval rule scoped to the caller's company.
   * Input: dto (CreateApprovalRuleDto) request body, req (RequestInterface) carrying userInfo.
   * Output: created ApprovalLevel entity.
   */
  @Post()
  create(@Body() dto: CreateApprovalRuleDto, @Request() req: RequestInterface) {
    return this.service.create(dto, req.userInfo);
  }
}
