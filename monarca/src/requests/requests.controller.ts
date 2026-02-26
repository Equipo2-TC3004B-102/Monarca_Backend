/**
 * requests.controller.ts
 * Description: REST controller that exposes CRUD endpoints for travel requests.
 * Handles creation, retrieval (by user, admin, SOI, travel agency), and updating
 * of requests. All routes are protected by AuthGuard and PermissionsGuard.
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
  constructor(private readonly requestsService: RequestsService) {}

  /**
   * create, creates a new travel request on behalf of the authenticated user.
   * Input: req (RequestInterface) - the authenticated request with session info,
   *        data (CreateRequestDto) - the request payload with origin, destinations, motive, etc.
   * Output: the newly created Request entity.
   */
  @Post()
  async create(
    @Request() req: RequestInterface,
    @Body() data: CreateRequestDto,
  ) {
    const result = await this.requestsService.create(req, data);
    return result;
  }

  /**
   * findByUser, retrieves all travel requests belonging to the authenticated user.
   * Input: req (RequestInterface) - the authenticated request with session info.
   * Output: array of Request entities owned by the user.
   */
  @Get('user')
  async findByUser(@Request() req: RequestInterface) {
    return this.requestsService.findByUser(req);
  }

  /**
   * findAssignedApprover, retrieves all requests assigned to the authenticated admin for approval.
   * Input: req (RequestInterface) - the authenticated request with session info.
   * Output: array of Request entities pending the admin's review, ordered by priority.
   */
  @Get('to-approve')
  async findAssignedApprover(@Request() req: RequestInterface) {
    return this.requestsService.findByAdmin(req);
  }

  /**
   * findAssignedSOI, retrieves all requests assigned to the authenticated SOI user.
   * Input: req (RequestInterface) - the authenticated request with session info.
   * Output: array of Request entities assigned to the SOI.
   */
  @Get('to-approve-SOI')
  async findAssignedSOI(@Request() req: RequestInterface) {
    return this.requestsService.findBySOI(req);
  }

  /**
   * findPendingRefundApproval, retrieves all requests in "Pending Refund Approval" status
   * assigned to the authenticated SOI user.
   * Input: req (RequestInterface) - the authenticated request with session info.
   * Output: array of Request entities pending refund approval for the SOI.
   */
  @Get('refund-to-approve-SOI')
  async findPendingRefundApproval(@Request() req: RequestInterface) {
    return this.requestsService.findPendingRefundApproval(req);
  }

  /**
   * findAssignedTA, retrieves all requests assigned to the authenticated travel agency
   * that are pending reservations.
   * Input: req (RequestInterface) - the authenticated request with session info.
   * Output: array of Request entities pending reservations for the travel agency.
   */
  @Get('to-reserve')
  async findAssignedTA(@Request() req: RequestInterface) {
    return this.requestsService.findByTA(req);
  }

  /**
   * findAll, retrieves all travel requests in the system with all related entities.
   * Input: none.
   * Output: array of all Request entities with destinations, revisions, users, and travel agency.
   */
  @Get('all')
  async findAll() {
    return this.requestsService.findAll();
  }

  /**
   * findOne, retrieves a single travel request by its UUID. Validates that the
   * authenticated user has permission to access the request.
   * Input: req (RequestInterface) - the authenticated request with session info,
   *        id (string) - UUID of the request.
   * Output: the Request entity if found and the user has access.
   */
  @Get(':id')
  async findOne(
    @Request() req: RequestInterface,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.requestsService.findOne(req, id);
  }

  /**
   * updateRequest, updates an existing travel request. Only the request owner can update,
   * and only when the status is "Pending Review" or "Changes Needed".
   * Input: id (string) - UUID of the request,
   *        data (UpdateRequestDto) - the updated request fields,
   *        req (RequestInterface) - the authenticated request with session info.
   * Output: the updated Request entity.
   */
  @Put(':id')
  async updateRequest(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() data: UpdateRequestDto,
    @Request() req: RequestInterface,
  ) {
    return this.requestsService.updateRequest(req, id, data);
  }
}
