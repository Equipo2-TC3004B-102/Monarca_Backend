/**
 * FileName: vouchers.module
 * Description: NestJS module that registers VouchersController and VouchersService,
 *              imports TypeORM repositories for Voucher and Request entities,
 *              and includes GuardsModule for authentication and authorization.
 * Authors: Original Moncarca team
 * Last Modification made:
 * 25/02/2026 [Diego de la Vega] Added detailed comments and documentation for clarity and maintainability.
 */

import { Module, Req } from '@nestjs/common';
import { VouchersController } from './vouchers.controller';
import { VouchersService } from './vouchers.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Voucher } from './entities/vouchers.entity';
import { Request } from 'src/requests/entities/request.entity';
import { GuardsModule } from 'src/guards/guards.module';
@Module({
  imports: [TypeOrmModule.forFeature([Voucher,Request ]),
  GuardsModule

],
  controllers: [VouchersController],
  providers: [VouchersService],
})
export class VouchersModule {}
