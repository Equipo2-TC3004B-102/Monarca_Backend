/**
 * FileName: approval-engine.controller.ts
 * Description: Controller for the approval engine feature. Exposes HTTP endpoints
 *              for managing approval levels and actors. All endpoints require the
 *              caller to be a company admin or system admin (flag-based guard).
 * Authors: DebugStudio Team
 * Last Modification:
 * 23/04/2026 [Julio Rodríguez] Added CRUD endpoints for ApprovalLevel and ApprovalLevelActor.
 */

import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApprovalEngineService } from './approval-engine.service';
import { AuthGuard } from 'src/guards/auth.guard';
import { PermissionsGuard } from 'src/guards/permissions.guard';
import { CompanyAdminGuard } from 'src/guards/company-admin.guard';
import { RequestInterface } from 'src/guards/interfaces/request.interface';
import { CreateApprovalLevelDto, UpdateApprovalLevelDto } from './dto/approval-level.dto';
import { CreateApprovalLevelActorDto, UpdateApprovalLevelActorDto } from './dto/approval-level-actor.dto';

@UseGuards(AuthGuard, PermissionsGuard, CompanyAdminGuard)
@Controller('approval-engine')
export class ApprovalEngineController {
  constructor(private readonly approvalEngineService: ApprovalEngineService) {}

  // ─── ApprovalLevel endpoints ──────────────────────────────────────────────

  /**
   * createLevel — Creates a new approval level for a company.
   * Input: body with CreateApprovalLevelDto.
   * Output: created ApprovalLevel entity.
   */
  @Post('levels')
  @HttpCode(200)
  async createLevel(
    @Body() dto: CreateApprovalLevelDto,
    @Req() req: RequestInterface,
  ) {
    return this.approvalEngineService.createApprovalLevel(dto, req.userInfo, req.ip);
  }

  /**
   * findAllLevels — Returns all approval levels visible to the caller.
   * System admins see all; company admins see only their company's levels.
   * Input: none.
   * Output: ApprovalLevel array.
   */
  @Get('levels')
  async findAllLevels(@Req() req: RequestInterface) {
    return this.approvalEngineService.findAllApprovalLevels(req.userInfo);
  }

  /**
   * findOneLevel — Returns one approval level by id.
   * Input: id path param (uuid).
   * Output: ApprovalLevel entity.
   */
  @Get('levels/:id')
  async findOneLevel(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Req() req: RequestInterface,
  ) {
    return this.approvalEngineService.findOneApprovalLevel(id, req.userInfo);
  }

  /**
   * updateLevel — Updates an existing approval level by id.
   * Input: id path param (uuid), body with UpdateApprovalLevelDto.
   * Output: updated ApprovalLevel entity.
   */
  @Patch('levels/:id')
  async updateLevel(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateApprovalLevelDto,
    @Req() req: RequestInterface,
  ) {
    return this.approvalEngineService.updateApprovalLevel(id, dto, req.userInfo, req.ip);
  }

  /**
   * removeLevel — Deletes an approval level by id.
   * Input: id path param (uuid).
   * Output: deletion confirmation object.
   */
  @Delete('levels/:id')
  async removeLevel(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Req() req: RequestInterface,
  ) {
    return this.approvalEngineService.removeApprovalLevel(id, req.userInfo);
  }

  // ─── ApprovalLevelActor endpoints ─────────────────────────────────────────

  @Post('actors')
  @HttpCode(200)
  async createActor(
    @Body() dto: CreateApprovalLevelActorDto,
    @Req() req: RequestInterface,
  ) {
    return this.approvalEngineService.createApprovalLevelActor(dto, req.userInfo);
  }

  @Get('levels/:levelId/actors')
  async findActorsByLevel(
    @Param('levelId', new ParseUUIDPipe()) levelId: string,
    @Req() req: RequestInterface,
  ) {
    return this.approvalEngineService.findActorsByLevel(levelId, req.userInfo);
  }

  @Get('actors/:id')
  async findOneActor(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Req() req: RequestInterface,
  ) {
    return this.approvalEngineService.findOneApprovalLevelActor(id, req.userInfo);
  }

  @Patch('actors/:id')
  async updateActor(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateApprovalLevelActorDto,
    @Req() req: RequestInterface,
  ) {
    return this.approvalEngineService.updateApprovalLevelActor(id, dto, req.userInfo);
  }

  @Delete('actors/:id')
  async removeActor(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Req() req: RequestInterface,
  ) {
    return this.approvalEngineService.removeApprovalLevelActor(id, req.userInfo);
  }
}

