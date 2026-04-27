import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApprovalRulesService } from './approval-rules.service';
import { CreateApprovalRuleDto } from './dto/approval-rule.dto';

@Controller('rules')
export class ApprovalRulesController {
  constructor(private readonly service: ApprovalRulesService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Post()
  create(@Body() dto: CreateApprovalRuleDto) {
    return this.service.create(dto);
  }
}
