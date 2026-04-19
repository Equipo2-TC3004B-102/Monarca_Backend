/**
 * FileName: requests.status.controller.ts
 * Description: Controller for request status transitions (approve, deny, cancel,
 *              and stage completion actions). All routes are protected by
 *              AuthGuard and PermissionsGuard.
 * Authors: Original Monarca team
 * Last Modification made:
 * 18/04/2026 [Julio Rodriguez] Added new endpoints for SOI approval and stage completions.
 *                            Updated endpoint contracts to include necessary parameters and permissions.
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
import { Permissions } from 'src/guards/decorators/permission.decorator';

@UseGuards(AuthGuard, PermissionsGuard)
@Controller('requests')
export class RequestsStatusController {
  constructor(private readonly requestsStatusService: RequestsStatusService) {}

  @Patch('approve/:id')
  @Permissions('approve_request') // Add appropriate permission for approving requests.
  @HttpCode(200)
  async approve(
    @Request() req: RequestInterface,
    @Param('id', new ParseUUIDPipe()) id_request: string,
    @Body() data: ApproveRequestDTO,
  ) {
    return await this.requestsStatusService.approve(req, id_request, data);
  }

  @Patch('deny/:id')
  @Permissions('deny_request') // Add appropriate permission for denying requests.
  @HttpCode(200)
  async deny(
    @Request() req: RequestInterface,
    @Param('id', new ParseUUIDPipe()) id_request: string,
  ) {
    return await this.requestsStatusService.deny(req, id_request);
  }

  @Patch('cancel/:id')
  @Permissions('edit_request') // Add appropriate permission for canceling requests.
  @HttpCode(200)
  async cancel(
    @Request() req: RequestInterface,
    @Param('id', new ParseUUIDPipe()) id_request: string,
  ) {
    return await this.requestsStatusService.cancel(req, id_request);
  }

  @Patch('finished-reservations/:id')
  @Permissions('submit_reservations') // Add appropriate permission for marking reservations as finished.
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
  @Permissions('approve_budget') // Add appropriate permission for SOI approval.
  @HttpCode(200)
  async SOIApproval(
    @Request() req: RequestInterface,
    @Param('id', new ParseUUIDPipe()) id_request: string,
  ) {
    return await this.requestsStatusService.SOIApproval(req, id_request);
  }

  @Patch('finished-uploading-vouchers/:id')
  @Permissions('upload_vouchers') // Add appropriate permission for marking voucher upload as finished.
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
  @Permissions('approve_vouchers')
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
  @Permissions('approve_budget') // Add appropriate permission for marking request as fully completed.
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
