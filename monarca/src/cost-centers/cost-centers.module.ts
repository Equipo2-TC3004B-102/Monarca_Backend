/**
 * FileName: cost-centers.module.ts
 * Description: Cost Centers module. Registers the CostCenter entity with TypeORM
 *              and exports the module for use in other modules that need access
 *              to cost center data.
 * Authors: Original Monarca team
 * Last Modification made:
 * 17/05/2026 [Santiago Coronado Hernández and Juan Pablo Narchi] Created module to encapsulate cost center functionality and register entity with TypeORM.
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CostCenter } from './entity/cost-centers.entity';
import { CostCentersController } from './cost-centers.controller';
import { CostCentersService } from './cost-centers.service';
import { GuardsModule } from 'src/guards/guards.module';

@Module({
  imports: [TypeOrmModule.forFeature([CostCenter]), GuardsModule],
  controllers: [CostCentersController],
  providers: [CostCentersService],
  exports: [TypeOrmModule, CostCentersService],
})
export class CostCentersModule {}
