import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApprovalLevel } from 'src/approval-engine/entities/approval-level.entity';
import { ApprovalRulesController } from './approval-rules.controller';
import { ApprovalRulesService } from './approval-rules.service';

@Module({
  imports: [TypeOrmModule.forFeature([ApprovalLevel])],
  controllers: [ApprovalRulesController],
  providers: [ApprovalRulesService],
})
export class ApprovalRulesModule {}
