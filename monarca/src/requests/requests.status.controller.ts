/**
 * requests.status.controller.ts
 * Description: REST controller that exposes endpoints for managing the lifecycle status
 * transitions of travel requests. Includes endpoints for approving, denying, cancelling,
 * finishing reservations, SOI approval, voucher uploads, voucher approvals, and completing
 * requests. All routes are protected by AuthGuard and PermissionsGuard.
 * Authors: Original Monarca team
 * Last Modification made:
 * 25/02/2026 [Juan Pablo Narchi Capote] Added detailed comments and documentation for clarity and maintainability.
 */

import {
  Controller,
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

  /**
   * approve, approves a travel request by assigning a travel agency and moving
   * the status to "Pending Reservations".
   * Input: req (RequestInterface) - the authenticated request with session info,
   *        id_request (string) - UUID of the request to approve,
   *        data (ApproveRequestDTO) - contains the travel agency UUID to assign.
   * Output: the updated Request entity with status "Pending Reservations".
   */
  @Patch('approve/:id')
  async approve(
    @Request() req: RequestInterface,
    @Param('id', new ParseUUIDPipe()) id_request: string,
    @Body() data: ApproveRequestDTO,
  ) {
    return await this.requestsStatusService.approve(req, id_request, data);
  }

  /**
   * deny, denies a travel request, changing its status to "Denied".
   * Input: req (RequestInterface) - the authenticated request with session info,
   *        id_request (string) - UUID of the request to deny.
   * Output: the updated Request entity with status "Denied".
   */
  @Patch('deny/:id')
  async deny(
    @Request() req: RequestInterface,
    @Param('id', new ParseUUIDPipe()) id_request: string,
  ) {
    return await this.requestsStatusService.deny(req, id_request);
  }

  /**
   * cancel, cancels a travel request, changing its status to "Cancelled".
   * Only the request owner can cancel, and only when in "Pending Review" or "Changes Needed".
   * Input: req (RequestInterface) - the authenticated request with session info,
   *        id_request (string) - UUID of the request to cancel.
   * Output: the updated Request entity with status "Cancelled".
   */
  @Patch('cancel/:id')
  async cancel(
    @Request() req: RequestInterface,
    @Param('id', new ParseUUIDPipe()) id_request: string,
  ) {
    return await this.requestsStatusService.cancel(req, id_request);
  }

  /**
   * finsihedReservations, marks a request as having completed its reservations,
   * moving the status to "Pending Accounting Approval".
   * Input: req (RequestInterface) - the authenticated request with session info,
   *        id_request (string) - UUID of the request.
   * Output: the updated Request entity with status "Pending Accounting Approval".
   */
  @Patch('finished-reservations/:id')
  async finsihedReservations(
    @Request() req: RequestInterface,
    @Param('id', new ParseUUIDPipe()) id_request: string,
  ) {
    return await this.requestsStatusService.finishedReservations(
      req,
      id_request,
    );
  }

  /**
   * SOIApproval, SOI approves the request's accounting, moving the status to "In Progress".
   * Input: req (RequestInterface) - the authenticated request with session info,
   *        id_request (string) - UUID of the request.
   * Output: the updated Request entity with status "In Progress".
   */
  @Patch('SOI-approve/:id')
  async SOIApproval(
    @Request() req: RequestInterface,
    @Param('id', new ParseUUIDPipe()) id_request: string,
  ) {
    return await this.requestsStatusService.SOIApproval(req, id_request);
  }

  /**
   * finsihedUploadingVouchers, marks that the user has finished uploading vouchers,
   * moving the status to "Pending Vouchers Approval".
   * Input: req (RequestInterface) - the authenticated request with session info,
   *        id_request (string) - UUID of the request.
   * Output: the updated Request entity with status "Pending Vouchers Approval".
   */
  @Patch('finished-uploading-vouchers/:id')
  async finsihedUploadingVouchers(
    @Request() req: RequestInterface,
    @Param('id', new ParseUUIDPipe()) id_request: string,
  ) {
    return await this.requestsStatusService.finishedUploadingVouchers(
      req,
      id_request,
    );
  }

  /**
   * finsihedApprovingVouchers, marks that the admin has finished approving vouchers,
   * moving the status to "Pending Refund Approval".
   * Input: req (RequestInterface) - the authenticated request with session info,
   *        id_request (string) - UUID of the request.
   * Output: the updated Request entity with status "Pending Refund Approval".
   */
  @Patch('finished-approving-vouchers/:id')
  async finsihedApprovingVouchers(
    @Request() req: RequestInterface,
    @Param('id', new ParseUUIDPipe()) id_request: string,
  ) {
    return await this.requestsStatusService.finishedApprovingVouchers(
      req,
      id_request,
    );
  }

  /**
   * finsihedRegisteringRequest, marks the request as fully completed by the SOI,
   * moving the status to "Completed".
   * Input: req (RequestInterface) - the authenticated request with session info,
   *        id_request (string) - UUID of the request.
   * Output: the updated Request entity with status "Completed".
   */
  @Patch('complete-request/:id')
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
