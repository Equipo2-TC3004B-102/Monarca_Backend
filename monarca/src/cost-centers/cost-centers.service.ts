/**
 * FileName: cost-centers.service.ts
 * Description: Service for managing cost centers. Provides methods for creating, retrieving, updating, and deleting cost centers within a company. Enforces business rules such as unique cost center IDs within a company and proper company assignment.
 * Authors: DebugStudio Team
 * Last Modification made: 
 * 17/05/2026 [Santiago Coronado Hernández and Juan Pablo Narchi] Implemented cost centers service with full CRUD operations and business rule enforcement.
 */

import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CostCenter } from './entity/cost-centers.entity';
import { CreateCostCenterDto } from './dto/create-cost-center.dto';
import { UpdateCostCenterDto } from './dto/update-cost-center.dto';

@Injectable()
export class CostCentersService {
  constructor(
    @InjectRepository(CostCenter)
    private readonly costCenterRepo: Repository<CostCenter>,
  ) {}

  /**
   * Create a new cost center for a company.
   * Validates: duplicate ID within company, company assignment validity.
   */
  async create(
    companyId: string,
    data: CreateCostCenterDto,
  ): Promise<CostCenter> {
    // Validate company match
    if (data.id_company !== companyId) {
      throw new BadRequestException({
        message: 'Cost center company must match the route company',
        code: 'COST_CENTERS_INVALID_COMPANY',
      });
    }

    // Check for duplicate ID globally; id is the primary key.
    const existing = await this.costCenterRepo.findOneBy({
      id: data.id,
    });

    if (existing) {
      throw new BadRequestException({
        message: `Cost center with ID ${data.id} already exists in this company`,
        code: 'COST_CENTERS_DUPLICATE_ID',
      });
    }

    const costCenter = this.costCenterRepo.create({
      id: data.id,
      name: data.name || null,
      id_company: companyId,
    });

    return this.costCenterRepo.save(costCenter);
  }

  /**
   * Find all cost centers for a specific company.
   */
  async findAll(companyId: string): Promise<CostCenter[]> {
    return this.costCenterRepo.find({
      where: { id_company: companyId },
    });
  }

  /**
   * Find a cost center by ID within a specific company.
   */
  async findOne(companyId: string, id: string): Promise<CostCenter> {
    const costCenter = await this.costCenterRepo.findOneBy({
      id,
      id_company: companyId,
    });

    if (!costCenter) {
      throw new BadRequestException({
        message: `Cost center ${id} not found in this company`,
        code: 'COST_CENTERS_INVALID_ID',
      });
    }

    return costCenter;
  }

  /**
   * Update a cost center within a specific company.
   */
  async update(
    companyId: string,
    id: string,
    data: UpdateCostCenterDto,
  ): Promise<CostCenter> {
    // Verify the cost center exists in this company
    const existing = await this.costCenterRepo.findOneBy({
      id,
      id_company: companyId,
    });

    if (!existing) {
      throw new BadRequestException({
        message: `Cost center ${id} not found in this company`,
        code: 'COST_CENTERS_INVALID_ID',
      });
    }

    // If trying to change company, reject it
    if (data.id_company && data.id_company !== companyId) {
      throw new BadRequestException({
        message: 'Cannot change cost center company',
        code: 'COST_CENTERS_FORBIDDEN_COMPANY',
      });
    }

    // If trying to change ID, check for duplicates in the new company context
    if (data.id && data.id !== id) {
      const duplicate = await this.costCenterRepo.findOneBy({
        id: data.id,
      });

      if (duplicate) {
        throw new BadRequestException({
          message: `Cost center with ID ${data.id} already exists in this company`,
          code: 'COST_CENTERS_DUPLICATE_ID',
        });
      }

      // Need to delete old and insert new due to varchar primary key
      await this.costCenterRepo.delete(id);
      const updated = this.costCenterRepo.create({
        id: data.id,
        name: data.name !== undefined ? data.name : existing.name,
        id_company: companyId,
      });
      return this.costCenterRepo.save(updated);
    }

    // Update only name if that's what changed
    if (data.name !== undefined) {
      await this.costCenterRepo.update(id, { name: data.name });
    }

    return this.findOne(companyId, id);
  }

  /**
   * Delete a cost center from a specific company.
   */
  async remove(
    companyId: string,
    id: string,
  ): Promise<{ status: boolean; message: string }> {
    const costCenter = await this.costCenterRepo.findOneBy({
      id,
      id_company: companyId,
    });

    if (!costCenter) {
      throw new BadRequestException({
        message: `Cost center ${id} not found in this company`,
        code: 'COST_CENTERS_INVALID_ID',
      });
    }

    await this.costCenterRepo.delete({ id, id_company: companyId });

    return {
      status: true,
      message: `Cost center ${id} removed`,
    };
  }
}
