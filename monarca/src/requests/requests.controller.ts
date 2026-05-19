/**
 * FileName: requests.controller.ts
 * Description: Controller for travel request endpoints. Exposes create, read,
 *              and update operations for requests, including role-specific list
 *              queries. All routes are protected by AuthGuard and PermissionsGuard.
 * Authors: Original Monarca team
 * Last Modification made:
 * 19/05/2026 [Julio Rodriguez]: Added new GET /requests/ta-history endpoint for travel agents to view their request history.
 */

import {
  Controller,
  Get,
  Post,
  HttpCode,
  Body,
  Patch,
  Param,
  Delete,
  ParseUUIDPipe,
  Request,
  UseGuards,
  Put,
} from '@nestjs/common';
import { RequestsService } from './requests.service';
import { CreateRequestDto } from './dto/create-request.dto';
import { UpdateRequestDto } from './dto/update-request.dto';
import { AuthGuard } from 'src/guards/auth.guard';
import { PermissionsGuard } from 'src/guards/permissions.guard';
import { RequestInterface } from 'src/guards/interfaces/request.interface';
import { Permissions } from 'src/guards/decorators/permission.decorator';

@UseGuards(AuthGuard, PermissionsGuard)
@Controller('requests')
export class RequestsController {
  constructor(private readonly requestsService: RequestsService) { }

  @Post()
  @Permissions('create_request')
  @HttpCode(200)
  async create(
    @Request() req: RequestInterface,
    @Body() data: CreateRequestDto,
  ) {
    return this.requestsService.create(req, data);
  }

  @Get('user')
  @Permissions('view_own_requests')
  async findByUser(@Request() req: RequestInterface) {
    return this.requestsService.findByUser(req);
  }

  @Get('to-approve')
  @Permissions('approve_request')
  async findAssignedApprover(@Request() req: RequestInterface) {
    return this.requestsService.findByAdmin(req);
  }

  @Get('to-approve-SOI')
  @Permissions('check_budgets')
  async findAssignedSOI(@Request() req: RequestInterface) {
    return this.requestsService.findBySOI(req);
  }
  @Get('refund-to-approve-SOI')
  @Permissions('check_budgets')
  async findPendingRefundApproval(@Request() req: RequestInterface) {
    return this.requestsService.findPendingRefundApproval(req);
  }

  @Get('to-reserve')
  @Permissions('submit_reservations')
  async findAssignedTA(@Request() req: RequestInterface) {
    return this.requestsService.findByTA(req);
  }

  @Get('all')
  @Permissions('view_assigned_requests_readonly')
  async findAll() {
    return this.requestsService.findAll();
  }

  @Get('reserved-history')
  @Permissions('view_assigned_requests_readonly')
  async findReservedHistory(@Request() req: RequestInterface) {
    return this.requestsService.findReservedHistory(req);
  }

  @Get('approved-history')
  @Permissions('view_approved_request_history')
  async findApprovedHistory() {
    return this.requestsService.findAll();
  }

  @Get('ta-history')
  @Permissions('view_travel_agent_history')
  async findTAHistory(@Request() req: RequestInterface) {
    return this.requestsService.findTAHistory(req);
  }

  // Modified to use the dictionary of flags
  @Get(':id')
  @Permissions('view_assigned_requests_readonly', 'approve_request', 'check_budgets', 'view_approved_request_history', 'submit_reservations', 'create_request')
  async findOne(
    @Request() req: RequestInterface,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.requestsService.findOne(req, id);
  }

  @Put(':id')
  @Permissions('edit_request')
  @HttpCode(200)
  async updateRequest(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() data: UpdateRequestDto,
    @Request() req: RequestInterface,
  ) {
    return this.requestsService.updateRequest(req, id, data);
  }
}
