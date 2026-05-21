/**
 * FileName: accounting.module.ts
 * Description: NestJS module for the accounting poliza feature. Registers the two
 *              accounting entities, the service, and the controller. Imports the
 *              Company, Request, Voucher, and User repositories needed by the service.
 * Authors: DebugStudio Team
 * Last Modification made:
 * 20/05/2026 [Julio Rodriguez] Created module.
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccountingService } from './accounting.service';
import { AccountingController } from './accounting.controller';
import { AccountingCatalog } from './entities/accounting-catalog.entity';
import { AccountingConcept } from './entities/accounting-concept.entity';
import { Company } from 'src/companies/entity/company.entity';
import { Request } from 'src/requests/entities/request.entity';
import { Voucher } from 'src/vouchers/entities/vouchers.entity';
import { User } from 'src/users/entities/user.entity';
import { GuardsModule } from 'src/guards/guards.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AccountingCatalog,
      AccountingConcept,
      Company,
      Request,
      Voucher,
      User,
    ]),
    GuardsModule,
  ],
  controllers: [AccountingController],
  providers: [AccountingService],
})
export class AccountingModule {}
