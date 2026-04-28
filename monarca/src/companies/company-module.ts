/**
 * FileName: companies.module.ts
 * Description: Companies module. Registers the Company entity with TypeORM
 *              and exports the module for use in other modules that need access
 *              to company data.
 * Authors: Debug Studio Team
 * Last Modification made:
 * 15/04/2026 [Julio Rodríguez] Added the CompaniesModule to register the Company entity and provide services for company operations.
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Company } from './entity/company.entity';
import { CompaniesController } from './companies.controller';
import { CompaniesService } from './companies.service';

@Module({
  imports: [TypeOrmModule.forFeature([Company])],
  controllers: [CompaniesController],
  providers: [CompaniesService],
  exports: [TypeOrmModule, CompaniesService],
})
export class CompaniesModule {}