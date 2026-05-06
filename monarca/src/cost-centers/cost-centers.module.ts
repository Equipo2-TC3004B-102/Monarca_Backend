/**
 * FileName: cost-centers.module.ts
 * Description: Cost Centers module. Registers the CostCenter entity with TypeORM,
 *              wires the controller and service for the CRUD endpoints, and
 *              imports GuardsModule so the auth/permissions/company-admin guards
 *              can resolve the caller. The Company repository is registered as
 *              well to validate the parent company on create/update.
 * Authors: Original Monarca team
 * Last Modification made:
 * 05/05/2026 [Juan Pablo Narchi] Wired controller and service for Cost Centers CRUD operations.
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CostCenter } from './entity/cost-centers.entity';
import { CostCentersController } from './cost-centers.controller';
import { CostCentersService } from './cost-centers.service';
import { Company } from 'src/companies/entity/company.entity';
import { GuardsModule } from 'src/guards/guards.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([CostCenter, Company]),
    GuardsModule,
  ],
  controllers: [CostCentersController],
  providers: [CostCentersService],
  exports: [TypeOrmModule, CostCentersService],
})
export class CostCentersModule {}
