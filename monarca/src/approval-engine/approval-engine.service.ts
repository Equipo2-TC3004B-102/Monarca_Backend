/**
 * FileName: approval-engine.service.ts
 * Description: Service for the approval engine feature. Handles business logic for
 *              approval levels and approval level actors. Company admins are scoped
 *              to their own company; system admins can access all companies.
 * Authors: DebugStudio Team
 * Last Modification:
 * 23/04/2026 [Julio Rodríguez] Added CRUD methods for ApprovalLevel and ApprovalLevelActor.
 */

import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApprovalLevel } from './entities/approval-level.entity';
import { ApprovalLevelActor } from './entities/approval-level-actor.entity';
import { CreateApprovalLevelDto, UpdateApprovalLevelDto } from './dto/approval-level.dto';
import { CreateApprovalLevelActorDto, UpdateApprovalLevelActorDto } from './dto/approval-level-actor.dto';
import { UserInfoInterface } from 'src/guards/interfaces/userInfo.interface';

@Injectable()
export class ApprovalEngineService {
  constructor(
    @InjectRepository(ApprovalLevel)
    private readonly approvalLevelRepository: Repository<ApprovalLevel>,

    @InjectRepository(ApprovalLevelActor)
    private readonly approvalLevelActorRepository: Repository<ApprovalLevelActor>,
  ) {}

  private clientError(message: string, code: string) {
    return new BadRequestException({ message, code });
  }

  // ─── ApprovalLevel ────────────────────────────────────────────────────────

  /**
   * createApprovalLevel — Creates a new approval level.
   * Company admins can only create levels for their own company.
   * Input: dto with level data, caller userInfo.
   * Output: created ApprovalLevel entity.
   */
  async createApprovalLevel(
    dto: CreateApprovalLevelDto,
    caller: UserInfoInterface,
  ): Promise<ApprovalLevel> {
    if (!caller.is_system_admin && caller.id_company !== dto.company_id) {
      throw new ForbiddenException({
        message: 'Cannot create approval levels for a different company',
        code: 'APPROVAL_ENGINE_FORBIDDEN_COMPANY',
      });
    }

    const entity = this.approvalLevelRepository.create(dto);
    return this.approvalLevelRepository.save(entity);
  }

  /**
   * findAllApprovalLevels — Returns all approval levels.
   * System admins see all; company admins see only their company's levels.
   * Input: caller userInfo.
   * Output: ApprovalLevel array.
   */
  async findAllApprovalLevels(caller: UserInfoInterface): Promise<ApprovalLevel[]> {
    if (caller.is_system_admin) {
      return this.approvalLevelRepository.find();
    }

    return this.approvalLevelRepository.find({
      where: { company_id: caller.id_company ?? undefined },
    });
  }

  /**
   * findOneApprovalLevel — Returns one approval level by id.
   * Throws 400 if not found. Company admins cannot access other companies' levels.
   * Input: level id, caller userInfo.
   * Output: ApprovalLevel entity.
   */
  async findOneApprovalLevel(
    id: string,
    caller: UserInfoInterface,
  ): Promise<ApprovalLevel> {
    const entity = await this.approvalLevelRepository.findOne({ where: { id } });

    if (!entity) {
      throw this.clientError(`ApprovalLevel ${id} not found`, 'APPROVAL_LEVEL_NOT_FOUND');
    }

    if (!caller.is_system_admin && entity.company_id !== caller.id_company) {
      throw new ForbiddenException({
        message: 'Access restricted to your own company approval levels',
        code: 'APPROVAL_ENGINE_FORBIDDEN_COMPANY',
      });
    }

    return entity;
  }

  /**
   * updateApprovalLevel — Updates an existing approval level by id.
   * Input: level id, UpdateApprovalLevelDto, caller userInfo.
   * Output: updated ApprovalLevel entity.
   */
  async updateApprovalLevel(
    id: string,
    dto: UpdateApprovalLevelDto,
    caller: UserInfoInterface,
  ): Promise<ApprovalLevel> {
    await this.findOneApprovalLevel(id, caller);
    await this.approvalLevelRepository.update(id, dto);
    return this.findOneApprovalLevel(id, caller);
  }

  /**
   * removeApprovalLevel — Deletes an approval level by id.
   * Input: level id, caller userInfo.
   * Output: deletion confirmation object.
   */
  async removeApprovalLevel(
    id: string,
    caller: UserInfoInterface,
  ): Promise<{ status: boolean; message: string }> {
    await this.findOneApprovalLevel(id, caller);
    await this.approvalLevelRepository.delete(id);
    return { status: true, message: `ApprovalLevel ${id} deleted` };
  }

  // ─── ApprovalLevelActor ───────────────────────────────────────────────────

  /**
   * createApprovalLevelActor — Creates an actor for an existing approval level.
   * Verifies the parent level exists and belongs to the caller's company.
   * Input: dto with actor data, caller userInfo.
   * Output: created ApprovalLevelActor entity.
   */
  async createApprovalLevelActor(
    dto: CreateApprovalLevelActorDto,
    caller: UserInfoInterface,
  ): Promise<ApprovalLevelActor> {
    await this.findOneApprovalLevel(dto.approval_level_id, caller);

    const entity = this.approvalLevelActorRepository.create(dto);
    return this.approvalLevelActorRepository.save(entity);
  }

  /**
   * findActorsByLevel — Returns all actors for a given approval level.
   * Verifies the level exists and belongs to the caller's company.
   * Input: approval level id, caller userInfo.
   * Output: ApprovalLevelActor array.
   */
  async findActorsByLevel(
    levelId: string,
    caller: UserInfoInterface,
  ): Promise<ApprovalLevelActor[]> {
    await this.findOneApprovalLevel(levelId, caller);

    return this.approvalLevelActorRepository.find({
      where: { approval_level_id: levelId },
    });
  }

  /**
   * findOneApprovalLevelActor — Returns one actor by id.
   * Company admins cannot access actors from other companies' levels.
   * Input: actor id, caller userInfo.
   * Output: ApprovalLevelActor entity.
   */
  async findOneApprovalLevelActor(
    id: string,
    caller: UserInfoInterface,
  ): Promise<ApprovalLevelActor> {
    const entity = await this.approvalLevelActorRepository.findOne({
      where: { id },
      relations: ['approval_level'],
    });

    if (!entity) {
      throw this.clientError(`ApprovalLevelActor ${id} not found`, 'APPROVAL_LEVEL_ACTOR_NOT_FOUND');
    }

    if (!caller.is_system_admin && entity.approval_level.company_id !== caller.id_company) {
      throw new ForbiddenException({
        message: 'Access restricted to your own company approval level actors',
        code: 'APPROVAL_ENGINE_FORBIDDEN_COMPANY',
      });
    }

    return entity;
  }

  /**
   * updateApprovalLevelActor — Updates an existing actor by id.
   * Input: actor id, UpdateApprovalLevelActorDto, caller userInfo.
   * Output: updated ApprovalLevelActor entity.
   */
  async updateApprovalLevelActor(
    id: string,
    dto: UpdateApprovalLevelActorDto,
    caller: UserInfoInterface,
  ): Promise<ApprovalLevelActor> {
    await this.findOneApprovalLevelActor(id, caller);
    await this.approvalLevelActorRepository.update(id, dto);
    return this.findOneApprovalLevelActor(id, caller);
  }

  /**
   * removeApprovalLevelActor — Deletes an actor by id.
   * Input: actor id, caller userInfo.
   * Output: deletion confirmation object.
   */
  async removeApprovalLevelActor(
    id: string,
    caller: UserInfoInterface,
  ): Promise<{ status: boolean; message: string }> {
    await this.findOneApprovalLevelActor(id, caller);
    await this.approvalLevelActorRepository.delete(id);
    return { status: true, message: `ApprovalLevelActor ${id} deleted` };
  }
}
