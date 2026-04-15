/**
 * FileName: companies.controller.ts
 * Description: Controller for company endpoints. Handles CRUD operations:
 *              create (POST /companies), findAll (GET /companies),
 *              findOne (GET /companies/:id), update (PATCH /companies/:id)
 *              and remove (DELETE /companies/:id).
 * Authors: Debug Studio Team
 * Last Modification made:
 * 15/04/2026 [Julio Rodriguez] Created controller for Companies CRUD operations.
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
} from '@nestjs/common';
import { CompaniesService } from './companies.service';
import { CreateCompanyDto, UpdateCompanyDto } from './dto/company.dtos';

@Controller('companies')
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  /**
   * create, creates a company resource.
   * Input: request body with CreateCompanyDto.
   * Output: created company entity.
   */
  @Post()
  @HttpCode(200)
  async create(@Body() createCompanyDto: CreateCompanyDto) {
    return this.companiesService.create(createCompanyDto);
  }

  /**
   * findAll, retrieves all company resources.
   * Input: none.
   * Output: list of companies.
   */
  @Get()
  async findAll() {
    return this.companiesService.findAll();
  }

  /**
   * findOne, retrieves one company by id.
   * Input: id path param (uuid).
   * Output: company record.
   */
  @Get(':id')
  async findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.companiesService.findOne(id);
  }

  /**
   * update, updates one company by id.
   * Input: id path param (uuid) and body with UpdateCompanyDto.
   * Output: updated company record.
   */
  @Patch(':id')
  async update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() updateCompanyDto: UpdateCompanyDto,
  ) {
    return this.companiesService.update(id, updateCompanyDto);
  }

  /**
   * remove, deletes one company by id.
   * Input: id path param (uuid).
   * Output: deletion confirmation object.
   */
  @Delete(':id')
  async remove(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.companiesService.remove(id);
  }
}
