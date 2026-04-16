/**
 * FileName: requests.controller.ts
 * Description: Controller for travel request endpoints. Exposes create, read,
 *              and update operations for requests, including role-specific list
 *              queries. All routes are protected by AuthGuard and PermissionsGuard.
 * Authors: Original Monarca team
 * Last Modification made:
 * 11/04/2026 [Julio Rodriguez] Standardized HTTP success code behavior and
 *                              aligned controller header documentation.
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

@UseGuards(AuthGuard, PermissionsGuard)
@Controller('requests')
export class RequestsController {
  constructor(private readonly requestsService: RequestsService) { }

  @Post()
  @HttpCode(200)
  async create(
    @Request() req: RequestInterface,
    @Body() data: CreateRequestDto,
  ) {
    const result = await this.requestsService.create(req, data);
    return result;
  }

  @Get('user')
  async findByUser(@Request() req: RequestInterface) {
    return this.requestsService.findByUser(req);
  }

  @Get('to-approve')
  async findAssignedApprover(@Request() req: RequestInterface) {
    return this.requestsService.findByAdmin(req);
  }

  @Get('to-approve-SOI')
  async findAssignedSOI(@Request() req: RequestInterface) {
    return this.requestsService.findBySOI(req);
  }
  // Para jalar todos los requests en estatus de Pending Refund Approval asignados a un SOI
  @Get('refund-to-approve-SOI')
  async findPendingRefundApproval(@Request() req: RequestInterface) {
    return this.requestsService.findPendingRefundApproval(req);
  }

  @Get('to-reserve')
  async findAssignedTA(@Request() req: RequestInterface) {
    return this.requestsService.findByTA(req);
  }

  @Get('all')
  async findAll() {
    return this.requestsService.findAll();
  }

  @Get(':id')
  async findOne(
    @Request() req: RequestInterface,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.requestsService.findOne(req, id);
  }

  @Put(':id')
  async updateRequest(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() data: UpdateRequestDto,
    @Request() req: RequestInterface,
  ) {
    return this.requestsService.updateRequest(req, id, data);
  }
}
