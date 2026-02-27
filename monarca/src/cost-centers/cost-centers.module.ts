/**
 * FileName: cost-centers.module.ts
 * Description: Cost Centers module. Registers the CostCenter entity with TypeORM
 *              and exports the module for use in other modules that need access
 *              to cost center data.
 * Authors: Original Monarca team
 * Last Modification made:
 * 25/02/2026 [Sergio Jiawei Xuan] Added detailed comments and documentation for clarity and maintainability.
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CostCenter } from './entity/cost-centers.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CostCenter])],
  exports: [TypeOrmModule],
})
export class CostCentersModule {}
