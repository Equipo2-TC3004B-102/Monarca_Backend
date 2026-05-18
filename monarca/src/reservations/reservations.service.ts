/**
 * FileName: reservations.service
 * Description: Business logic layer for Reservation operations. Handles creation with
 *              travel-agency ownership and request-status validation, as well as retrieval,
 *              update, and deletion of reservations.
 * Authors: Original Moncarca team
 * Last Modification made:
 * 14/05/2026 [Diego de la Vega] When a reservation is created with a provider_id (e.g. Duffel),
 *                               provider_support_status on the linked RequestsDestination is
 *                               updated to 'supported' so the frontend reflects the correct state.
 */

import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Reservation } from './entity/reservations.entity';
import {
  CreateReservationDto,
  UpdateReservationDto,
} from './dto/reservation.dtos';
import { RequestsChecks } from 'src/requests/requests.checks';
import { RequestInterface } from 'src/guards/interfaces/request.interface';
import { RequestsDestination } from 'src/requests/entities/requests-destination.entity';


@Injectable()
export class ReservationsService {
  constructor(
    @InjectRepository(Reservation)
    private readonly reservationsRepository: Repository<Reservation>,

    @InjectRepository(RequestsDestination)
    private readonly requestsDestinationRepository: Repository<RequestsDestination>,

    private readonly requestChecks: RequestsChecks,
  ) {}

  /**
   * createReservation - Creates and persists a new reservation after validating that
   *                      the travel agency owns the request destination and the request
   *                      is in 'Pending Reservations' status.
   *                      If the reservation includes a provider_id, the linked
   *                      RequestsDestination is updated to provider_support_status = 'supported'.
   * Input: req (RequestInterface) - session info containing the travel agency ID;
   *        reservation (CreateReservationDto) - fields: title, comments, price,
   *        id_request_destination, and optional file link, provider_id, provider_name.
   * Output: Promise<Reservation> - the newly saved reservation entity.
   * Throws BadRequestException if the agency does not own the destination or
   *        the request is not in the correct status.
   */
  async createReservation(req: RequestInterface, reservation: CreateReservationDto) {

    // Allow creation if:
    // - User is a travel agent (regardless of agency assignment)
    // - User's travel agency matches the request destination's agency
    const id_travel_agency = req.userInfo.id_travel_agency;
    const isTravelAgent = req.userInfo?.is_travelAgent === true;

    const hasPermission = isTravelAgent ||
      (id_travel_agency && await this.requestChecks.isRequestDestinationTravelAgencyId(reservation.id_request_destination, id_travel_agency));

    if (!hasPermission) {
      throw new BadRequestException('Unable to add reservation to that request.');
    }

    // Validate request status
    const requestStatus = await this.requestChecks.getRequestStatusFromRequestDestination(reservation.id_request_destination);
    if (requestStatus !== 'Pending Reservations') {
      throw new BadRequestException('Unable to create reservation because of the requests status.');
    }

    const newReservation = this.reservationsRepository.create(reservation);
    const saved = await this.reservationsRepository.save(newReservation);

    // If the reservation was made through a known provider (e.g. Duffel), mark the
    // destination as supported so the frontend shows the correct provider status.
    if (reservation.provider_id) {
      await this.requestsDestinationRepository.update(
        reservation.id_request_destination,
        {
          provider_support_status: 'supported',
          provider_support_checked_at: new Date(),
        },
      );
    }

    return saved;
  }

  /**
   * findAll - Retrieves all reservation records from the database without filters.
   * Input: None
   * Output: Promise<Reservation[]> - array of all persisted reservation entities.
   */
  async findAll(): Promise<Reservation[]> {
    return this.reservationsRepository.find();
  }

  /**
   * findOne - Retrieves a single reservation by its UUID.
   * Input: id (string) - UUID of the reservation to retrieve.
   * Output: Promise<Reservation> - the matching reservation entity.
   * Throws BadRequestException if no reservation with the given ID exists.
   */
  async findOne(id: string): Promise<Reservation> {
    const reservation = await this.reservationsRepository.findOneBy({ id });
    if (!reservation) {
      throw new BadRequestException(`Reservation ${id} not found`);
    }
    return reservation;
  }

  /**
   * update - Partially updates a reservation's fields by its UUID.
   * Input: id (string) - UUID of the reservation to update;
   *        Body (UpdateReservationDto) - optional fields to overwrite (title, comments, price,
   *        id_request_destination, file).
   * Output: Promise<UpdateResult> - TypeORM result indicating affected rows.
   */
  async update(id: string, Body: UpdateReservationDto) {
    return await this.reservationsRepository.update(id, Body);
  }

  /**
   * remove - Deletes a reservation record from the database by its UUID.
   * Input: id (string) - UUID of the reservation to delete.
   * Output: Promise<{ message: string; status: boolean }> - confirmation message and success flag.
   */
  async remove(id: string): Promise<{ message: string; status: boolean }> {
    const reservation = await this.reservationsRepository.findOneBy({ id });
    await this.reservationsRepository.delete(id);
    return {
      message: `Reservation ${reservation?.id} deleted,`,
      status: true,
    };
  }
}
