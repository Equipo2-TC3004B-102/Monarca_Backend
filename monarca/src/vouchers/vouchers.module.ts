/**
 * FileName: vouchers.module
 * Description: NestJS module that registers VouchersController and VouchersService,
 *              imports TypeORM repositories for Voucher and Request entities,
 *              and includes GuardsModule for authentication and authorization.
 * Authors: Original Moncarca team
 * Last Modification made:
 * 17/04/2026 [Fausto Izquierdo] Added XmlParserService provider for CFDI extraction.
 */

import { Module } from '@nestjs/common';
import { VouchersController } from './vouchers.controller';
import { VouchersService } from './vouchers.service';
import { XmlParserService } from './services/xml-parser.service';
import { CfdiValidationService } from './services/cfdi-validation.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Voucher } from './entities/vouchers.entity';
import { Request } from 'src/requests/entities/request.entity';
import { GuardsModule } from 'src/guards/guards.module';
@Module({
  imports: [TypeOrmModule.forFeature([Voucher, Request]), GuardsModule],
  controllers: [VouchersController],
  providers: [VouchersService, XmlParserService, CfdiValidationService],
})
export class VouchersModule {}
