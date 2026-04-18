/**
 * FileName: requests.status.controller.ts
 * Description: Controller for request status transitions (approve, deny, cancel,
 *              and stage completion actions). All routes are protected by
 *              AuthGuard and PermissionsGuard.
 * Authors: Original Monarca team
 * Last Modification made:
 * 11/04/2026 [Julio Rodriguez] Standardized explicit HTTP success codes for
 *                              all status transition endpoints.
 */

import {
  Controller,
  HttpCode,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseUUIDPipe,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from 'src/guards/auth.guard';
import { PermissionsGuard } from 'src/guards/permissions.guard';
import { RequestInterface } from 'src/guards/interfaces/request.interface';
import { RequestsStatusService } from './requests.status.service';
import { ApproveRequestDTO } from './dto/approve-request.dto';

@UseGuards(AuthGuard, PermissionsGuard)
@Controller('requests')
export class RequestsStatusController {
  constructor(private readonly requestsStatusService: RequestsStatusService) {}

  @Patch('approve/:id')
  @HttpCode(200)
  async approve(
    @Request() req: RequestInterface,
    @Param('id', new ParseUUIDPipe()) id_request: string,
    @Body() data: ApproveRequestDTO,
  ) {
    return await this.requestsStatusService.approve(req, id_request, data);
  }

  @Patch('deny/:id')
  @HttpCode(200)
  async deny(
    @Request() req: RequestInterface,
    @Param('id', new ParseUUIDPipe()) id_request: string,
  ) {
    return await this.requestsStatusService.deny(req, id_request);
  }

  @Patch('cancel/:id')
  @HttpCode(200)
  async cancel(
    @Request() req: RequestInterface,
    @Param('id', new ParseUUIDPipe()) id_request: string,
  ) {
    return await this.requestsStatusService.cancel(req, id_request);
  }

  @Patch('finished-reservations/:id')
  @HttpCode(200)
  async finsihedReservations(
    @Request() req: RequestInterface,
    @Param('id', new ParseUUIDPipe()) id_request: string,
  ) {
    return await this.requestsStatusService.finishedReservations(
      req,
      id_request,
    );
  }

  @Patch('SOI-approve/:id')
  @HttpCode(200)
  async SOIApproval(
    @Request() req: RequestInterface,
    @Param('id', new ParseUUIDPipe()) id_request: string,
  ) {
    return await this.requestsStatusService.SOIApproval(req, id_request);
  }

  @Patch('finished-uploading-vouchers/:id')
  @HttpCode(200)
  async finsihedUploadingVouchers(
    @Request() req: RequestInterface,
    @Param('id', new ParseUUIDPipe()) id_request: string,
  ) {
    return await this.requestsStatusService.finishedUploadingVouchers(
      req,
      id_request,
    );
  }

  @Patch('finished-approving-vouchers/:id')
  @HttpCode(200)
  async finsihedApprovingVouchers(
    @Request() req: RequestInterface,
    @Param('id', new ParseUUIDPipe()) id_request: string,
  ) {
    return await this.requestsStatusService.finishedApprovingVouchers(
      req,
      id_request,
    );
  }

  @Patch('complete-request/:id')
  @HttpCode(200)
  async finsihedRegisteringRequest(
    @Request() req: RequestInterface,
    @Param('id', new ParseUUIDPipe()) id_request: string,
  ) {
    return await this.requestsStatusService.finsihedRegisteringRequest(
      req,
      id_request,
    );
  }
}
