/**
 * FileName: vouchers.module
 * Description: NestJS module that registers VouchersController and VouchersService,
 *              imports TypeORM repositories for Voucher and Request entities,
 *              and includes GuardsModule for authentication and authorization.
 * Authors: Original Moncarca team
 * Last Modification made:
 * 27/05/2026 [Julio Rodriguez] Added RequestLogsModule to support request_logs entries from VouchersService.
 */

import { Module } from '@nestjs/common';
import { VouchersController } from './vouchers.controller';
import { VouchersService } from './vouchers.service';
import { XmlParserService } from './services/xml-parser.service';
import { CfdiValidationService } from './services/cfdi-validation.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Voucher } from './entities/vouchers.entity';
import { VoucherCreationLog } from './entities/voucher-creation-log.entity';
import { Request } from 'src/requests/entities/request.entity';
import { RequestsDestination } from 'src/requests/entities/requests-destination.entity';
import { Company } from 'src/companies/entity/company.entity';
import { GuardsModule } from 'src/guards/guards.module';
import { RequestLogsModule } from 'src/request-logs/request-logs.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Voucher, VoucherCreationLog, Request, RequestsDestination, Company]),
    GuardsModule,
    RequestLogsModule,
  ],
  controllers: [VouchersController],
  providers: [VouchersService, XmlParserService, CfdiValidationService],
})
export class VouchersModule {}
