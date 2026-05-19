/**
 * FileName: cost-centers.controller.ts
 * Description: Controller for cost center endpoints. Exposes CRUD operations
 *              under /companies/:company_id/cost-centers. Requests are scoped by company;
 *              only company admins and approvers can manage cost centers within their company.
 *              System admins can manage any company's cost centers.
 * Authors: DebugStudio Team
 * Last Modification made: 
 * 17/05/2026 [Santiago Coronado Hernández and Juan Pablo Narchi] Implemented cost centers controller with company scoping and permission guards.
 */

import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseUUIDPipe,
  HttpCode,
  UseGuards,
} from '@nestjs/common';
import { CostCentersService } from './cost-centers.service';
import { CreateCostCenterDto } from './dto/create-cost-center.dto';
import { UpdateCostCenterDto } from './dto/update-cost-center.dto';
import { AuthGuard } from 'src/guards/auth.guard';
import { PermissionsGuard } from 'src/guards/permissions.guard';
import { CompanyAdminGuard } from 'src/guards/company-admin.guard';
import { Permissions } from 'src/guards/decorators/permission.decorator';

@UseGuards(AuthGuard, PermissionsGuard, CompanyAdminGuard)
@Controller('companies/:company_id/cost-centers')
export class CostCentersController {
  constructor(private readonly costCentersService: CostCentersService) {}

  @Post()
  @Permissions('create_cost_center')
  @HttpCode(201)
  create(
    @Param('company_id', new ParseUUIDPipe()) companyId: string,
    @Body() createCostCenterDto: CreateCostCenterDto,
  ) {
    return this.costCentersService.create(companyId, createCostCenterDto);
  }

  @Get()
  @Permissions('read_cost_center')
  findAll(@Param('company_id', new ParseUUIDPipe()) companyId: string) {
    return this.costCentersService.findAll(companyId);
  }

  @Get(':id')
  @Permissions('read_cost_center')
  findOne(
    @Param('company_id', new ParseUUIDPipe()) companyId: string,
    @Param('id') id: string,
  ) {
    return this.costCentersService.findOne(companyId, id);
  }

  @Patch(':id')
  @Permissions('update_cost_center')
  update(
    @Param('company_id', new ParseUUIDPipe()) companyId: string,
    @Param('id') id: string,
    @Body() updateCostCenterDto: UpdateCostCenterDto,
  ) {
    return this.costCentersService.update(
      companyId,
      id,
      updateCostCenterDto,
    );
  }

  @Delete(':id')
  @Permissions('delete_cost_center')
  @HttpCode(204)
  remove(
    @Param('company_id', new ParseUUIDPipe()) companyId: string,
    @Param('id') id: string,
  ) {
    return this.costCentersService.remove(companyId, id);
  }
}
