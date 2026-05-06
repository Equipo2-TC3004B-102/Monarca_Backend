/**
 * FileName: cost-centers.controller.ts
 * Description: Controller for cost center endpoints. Handles CRUD operations:
 *              create (POST /cost-centers), findAll (GET /cost-centers),
 *              findOne (GET /cost-centers/:id), update (PATCH /cost-centers/:id)
 *              and remove (DELETE /cost-centers/:id). The :id path parameter is
 *              a varchar code (e.g. "TEC-001"), matching the entity primary key.
 *              All endpoints require the caller to be authenticated and have
 *              the matching cost-center permission, and to be a company admin
 *              or system admin.
 * Authors: Juan Pablo Narchi
 * Last Modification made:
 * 05/05/2026 [Juan Pablo Narchi] Created controller for Cost Centers CRUD operations.
 */

import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CostCentersService } from './cost-centers.service';
import {
  CreateCostCenterDto,
  UpdateCostCenterDto,
} from './dto/cost-center.dtos';
import { AuthGuard } from 'src/guards/auth.guard';
import { PermissionsGuard } from 'src/guards/permissions.guard';
import { CompanyAdminGuard } from 'src/guards/company-admin.guard';
import { Permissions } from 'src/guards/decorators/permission.decorator';
import { RequestInterface } from 'src/guards/interfaces/request.interface';

@UseGuards(AuthGuard, PermissionsGuard, CompanyAdminGuard)
@Controller('cost-centers')
export class CostCentersController {
  constructor(private readonly costCentersService: CostCentersService) {}

  /**
   * create, creates a cost center resource.
   * Input: request body with CreateCostCenterDto (id, optional name, id_company).
   * Output: created cost center entity.
   */
  @Post()
  @HttpCode(200)
  @Permissions('create_cost_center')
  async create(
    @Body() dto: CreateCostCenterDto,
    @Req() req: RequestInterface,
  ) {
    return this.costCentersService.create(dto, req.userInfo);
  }

  /**
   * findAll, retrieves all cost centers visible to the caller.
   * Input: none.
   * Output: list of cost centers.
   */
  @Get()
  @Permissions('read_cost_center')
  async findAll(@Req() req: RequestInterface) {
    return this.costCentersService.findAll(req.userInfo);
  }

  /**
   * findOne, retrieves one cost center by id.
   * Input: id path param (varchar code, e.g. "TEC-001").
   * Output: cost center record.
   */
  @Get(':id')
  @Permissions('read_cost_center')
  async findOne(
    @Param('id') id: string,
    @Req() req: RequestInterface,
  ) {
    return this.costCentersService.findOne(id, req.userInfo);
  }

  /**
   * update, updates one cost center by id.
   * Input: id path param (varchar code) and body with UpdateCostCenterDto.
   * Output: updated cost center record.
   */
  @Patch(':id')
  @Permissions('update_cost_center')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateCostCenterDto,
    @Req() req: RequestInterface,
  ) {
    return this.costCentersService.update(id, dto, req.userInfo);
  }

  /**
   * remove, deletes one cost center by id.
   * Input: id path param (varchar code).
   * Output: deletion confirmation object.
   */
  @Delete(':id')
  @Permissions('delete_cost_center')
  async remove(
    @Param('id') id: string,
    @Req() req: RequestInterface,
  ) {
    return this.costCentersService.remove(id, req.userInfo);
  }
}
