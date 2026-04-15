/**
 * FileName: companies.service.ts
 * Description: Service handling company business logic. Provides CRUD operations
 *              against the companies table and validation for existing records.
 * Authors: Debug Studio Team
 * Last Modification made:
 * 15/04/2026 [Julio Rodriguez] Created service for Companies CRUD operations.
 */

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Company } from './entity/company.entity';
import { CompanyDto, CreateCompanyDto, UpdateCompanyDto } from './dto/company.dtos';

@Injectable()
export class CompaniesService {
  constructor(
    @InjectRepository(Company)
    private readonly repo: Repository<Company>,
  ) {}

  /**
   * create, stores a new company in database.
   * Input: createCompanyDto with required fields (name, local_currency).
   * Output: Promise<Company> with the created company data.
   */
  async create(createCompanyDto: CreateCompanyDto): Promise<Company> {
    const entity = this.repo.create(createCompanyDto);
    return this.repo.save(entity);
  }

  /**
   * findAll, retrieves all companies.
   * Input: none.
   * Output: Promise<CompanyDto[]> with all registered companies.
   */
  async findAll(): Promise<CompanyDto[]> {
    return this.repo.find();
  }

  /**
   * findOne, retrieves one company by id.
   * Input: company id (uuid).
   * Output: Promise<CompanyDto> with the company data if found.
   */
  async findOne(id: string): Promise<CompanyDto> {
    const entity = await this.repo.findOne({ where: { id } });

    if (!entity) {
      throw new NotFoundException(`Company ${id} not found`);
    }

    return entity;
  }

  /**
   * update, modifies an existing company by id.
   * Input: company id (uuid), and UpdateCompanyDto with partial fields.
   * Output: Promise<CompanyDto> with updated company data.
   */
  async update(id: string, updateCompanyDto: UpdateCompanyDto): Promise<CompanyDto> {
    await this.repo.update(id, updateCompanyDto);
    return this.findOne(id);
  }

  /**
   * remove, deletes an existing company by id.
   * Input: company id (uuid).
   * Output: Promise<{ status: boolean; message: string }> confirming deletion.
   */
  async remove(id: string): Promise<{ status: boolean; message: string }> {
    const existing = await this.repo.findOne({ where: { id } });

    if (!existing) {
      throw new NotFoundException(`Company ${id} not found`);
    }

    await this.repo.delete(id);
    return { status: true, message: `Company ${id} deleted` };
  }
}
