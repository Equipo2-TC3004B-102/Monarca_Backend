/**
 * FileName: cost-centers.service.ts
 * Description: Service handling cost center business logic. Provides CRUD
 *              operations against the cost_centers table, validates the parent
 *              company existence, and enforces company-level access scoping
 *              (company admins can only operate over their own company).
 * Authors: Juan Pablo Narchi
 * Last Modification made:
 * 05/05/2026 [Juan Pablo Narchi] Created service for Cost Centers CRUD operations.
 */

import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CostCenter } from './entity/cost-centers.entity';
import { Company } from 'src/companies/entity/company.entity';
import {
  CostCenterDto,
  CreateCostCenterDto,
  UpdateCostCenterDto,
} from './dto/cost-center.dtos';
import { UserInfoInterface } from 'src/guards/interfaces/userInfo.interface';

@Injectable()
export class CostCentersService {
  constructor(
    @InjectRepository(CostCenter)
    private readonly repo: Repository<CostCenter>,

    @InjectRepository(Company)
    private readonly companiesRepo: Repository<Company>,
  ) {}

  private clientError(message: string, code: string) {
    return new BadRequestException({ message, code });
  }

  private assertSameCompany(
    caller: UserInfoInterface,
    targetCompanyId: string,
  ): void {
    if (caller.is_system_admin) return;
    if (caller.id_company !== targetCompanyId) {
      throw new ForbiddenException({
        message: 'Access restricted to your own company cost centers',
        code: 'COST_CENTERS_FORBIDDEN_COMPANY',
      });
    }
  }

  /**
   * create, stores a new cost center in database.
   * Validates the parent company exists, that the caller may operate on it,
   * and that the supplied id (varchar PK code) is not already taken.
   * Input: createCostCenterDto with id, optional name and id_company; caller userInfo.
   * Output: Promise<CostCenter> with the created cost center.
   */
  async create(
    dto: CreateCostCenterDto,
    caller: UserInfoInterface,
  ): Promise<CostCenter> {
    this.assertSameCompany(caller, dto.id_company);

    const existing = await this.repo.findOne({ where: { id: dto.id } });
    if (existing) {
      throw this.clientError(
        `CostCenter with id ${dto.id} already exists`,
        'COST_CENTERS_DUPLICATE_ID',
      );
    }

    const company = await this.companiesRepo.findOne({
      where: { id: dto.id_company },
    });
    if (!company) {
      throw this.clientError(
        `Company ${dto.id_company} not found`,
        'COST_CENTERS_INVALID_COMPANY',
      );
    }

    const entity = this.repo.create(dto);
    return this.repo.save(entity);
  }

  /**
   * findAll, retrieves cost centers visible to the caller. System admins see
   * all records; everyone else is scoped to their own company.
   * Input: caller userInfo.
   * Output: Promise<CostCenterDto[]>.
   */
  async findAll(caller: UserInfoInterface): Promise<CostCenterDto[]> {
    if (caller.is_system_admin) {
      return this.repo.find();
    }
    return this.repo.find({
      where: { id_company: caller.id_company ?? undefined },
    });
  }

  /**
   * findOne, retrieves one cost center by id. Enforces company scoping.
   * Input: cost center id (uuid); caller userInfo.
   * Output: Promise<CostCenterDto> with the cost center if found.
   */
  async findOne(id: string, caller: UserInfoInterface): Promise<CostCenterDto> {
    const entity = await this.repo.findOne({ where: { id } });
    if (!entity) {
      throw this.clientError(
        `CostCenter ${id} not found`,
        'COST_CENTERS_INVALID_ID',
      );
    }
    this.assertSameCompany(caller, entity.id_company);
    return entity;
  }

  /**
   * update, modifies an existing cost center by id.
   * Input: cost center id (uuid), UpdateCostCenterDto with partial fields, caller userInfo.
   * Output: Promise<CostCenterDto> with updated record.
   */
  async update(
    id: string,
    dto: UpdateCostCenterDto,
    caller: UserInfoInterface,
  ): Promise<CostCenterDto> {
    const existing = await this.findOne(id, caller);

    if (dto.id_company && dto.id_company !== existing.id_company) {
      this.assertSameCompany(caller, dto.id_company);
      const company = await this.companiesRepo.findOne({
        where: { id: dto.id_company },
      });
      if (!company) {
        throw this.clientError(
          `Company ${dto.id_company} not found`,
          'COST_CENTERS_INVALID_COMPANY',
        );
      }
    }

    await this.repo.update(id, dto);
    return this.findOne(id, caller);
  }

  /**
   * remove, deletes an existing cost center by id.
   * Input: cost center id (uuid), caller userInfo.
   * Output: Promise<{ status: boolean; message: string }> confirming deletion.
   */
  async remove(
    id: string,
    caller: UserInfoInterface,
  ): Promise<{ status: boolean; message: string }> {
    await this.findOne(id, caller);
    await this.repo.delete(id);
    return { status: true, message: `CostCenter ${id} deleted` };
  }
}
