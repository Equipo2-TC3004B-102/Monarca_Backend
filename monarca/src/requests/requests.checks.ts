/**
 * requests.checks.ts
 * Description: Injectable service that provides validation and lookup helper methods
 * for the Request and RequestsDestination entities. Used to verify ownership,
 * existence, status, and travel agency associations of requests.
 * Authors: Original Monarca team
 * Last Modification made:
 * 25/02/2026 [Juan Pablo Narchi Capote] Added detailed comments and documentation for clarity and maintainability.
 */

import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Request as RequestEntity } from './entities/request.entity';
import { RequestsDestination } from './entities/requests-destination.entity';

@Injectable()
export class RequestsChecks {
  constructor(
    @InjectRepository(RequestEntity)
    private readonly requestsRepo: Repository<RequestEntity>,
    @InjectRepository(RequestsDestination)
    private readonly requestsDestinationRepo: Repository<RequestsDestination>,
  ) {}

  /**
   * isRequestsAdmin, checks whether a given user is the assigned admin of a specific request.
   * Input: id_request (string) - the UUID of the request, id_user (string) - the UUID of the user.
   * Output: boolean - true if the user is the admin of the request, false otherwise.
   */
  async isRequestsAdmin(id_request: string, id_user: string) {
    const request = await this.requestsRepo.findOne({
      where: { id_admin: id_user, id: id_request },
      relations: [],
    });

    return !!request;
  }

  /**
   * requestExists, checks whether a request with the given ID exists in the database.
   * Input: id_request (string) - the UUID of the request.
   * Output: boolean - true if the request exists, false otherwise.
   */
  async requestExists(id_request: string) {
    const request = await this.requestsRepo.findOne({
      where: { id: id_request },
    });

    return !!request;
  }

  /**
   * requestDestinationExists, checks whether a request destination with the given ID exists.
   * Input: id_request_destination (string) - the UUID of the request destination.
   * Output: boolean - true if the request destination exists, false otherwise.
   */
  async requestDestinationExists(id_request_destination: string) {
    const requestDestination = await this.requestsDestinationRepo.findOne({
      where: { id: id_request_destination },
    });

    return !!requestDestination;
  }

  /**
   * getRequestStatus, retrieves the current status of a request by its ID.
   * Input: id_request (string) - the UUID of the request.
   * Output: string - the current status of the request.
   */
  async getRequestStatus(id_request: string) {
    const request = await this.requestsRepo.findOne({
      where: { id: id_request },
      select: ['status']

    });

    return request!.status;
  }

  /**
   * getRequestStatusFromRequestDestination, retrieves the status of the parent request
   * associated with a given request destination.
   * Input: id_request_destination (string) - the UUID of the request destination.
   * Output: string - the status of the parent request.
   */
  async getRequestStatusFromRequestDestination(id_request_destination: string) {
    const requestDestination = await this.requestsDestinationRepo.findOne({
      where: { id: id_request_destination},
      relations: ['request']
    });

    return requestDestination!.request.status;
  }

  /**
   * isRequestDestinationTravelAgencyId, verifies whether a request destination belongs
   * to a request assigned to a specific travel agency.
   * Input: id_request_destination (string) - the UUID of the request destination,
   *        id_travel_agency (string) - the UUID of the travel agency.
   * Output: boolean - true if the request destination's parent request is assigned to
   *         the given travel agency, false otherwise.
   */
  async isRequestDestinationTravelAgencyId(id_request_destination: string, id_travel_agency: string)
  {
    const requestDestination = await this.requestsDestinationRepo.findOne({
      where: { id: id_request_destination,
        request: {
          id_travel_agency: id_travel_agency
        }},
      relations: ['request']
    });

    return !!requestDestination;
  }

}
