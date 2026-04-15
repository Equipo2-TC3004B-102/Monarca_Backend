/**
 * FileName: companies.module.ts
 * Description: Companies module. Registers the Company entity with TypeORM
 *              and exports the module for use in other modules that need access
 *              to company data.
 * Authors: Debug Studio Team
 * Last Modification made:
 * 14/04/2026 [Julio Rodríguez] Created the CompaniesModule to manage company-related data and functionality.
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Company } from './entity/company.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Company])],
  exports: [TypeOrmModule],
})
export class CompaniesModule {}