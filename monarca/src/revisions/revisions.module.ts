/**
 * FileName: revisions.module
 * Description: NestJS module that registers RevisionsController and RevisionsService,
 *              imports the TypeORM repository for the Revision entity, and includes
 *              RequestsModule, NotificationsModule, UsersModule, and GuardsModule
 *              required by the revision business logic.
 * Authors: Original Moncarca team
 * Last Modification made:
 * 25/02/2026 [Diego de la Vega] Added detailed comments and documentation for clarity and maintainability.
 */

import { Module } from '@nestjs/common';
import { RevisionsController } from './revisions.controller';
import { RevisionsService } from './revisions.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Revision } from './entities/revision.entity';
import { RequestsModule } from 'src/requests/requests.module';
import { GuardsModule } from 'src/guards/guards.module';
import { NotificationsModule } from 'src/notifications/notifications.module';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [TypeOrmModule.forFeature([Revision]), NotificationsModule, UsersModule, RequestsModule, GuardsModule],
  controllers: [RevisionsController],
  providers: [RevisionsService],
})
export class RevisionsModule {}
