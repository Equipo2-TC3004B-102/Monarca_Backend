/**
 * requests.status.service.ts
 * Description: Service that manages the status lifecycle transitions of travel requests.
 * Handles approving, denying, cancelling, finishing reservations, SOI accounting approval,
 * voucher upload completion, voucher approval, and final request completion. Each transition
 * validates authorization, current status, and sends email notifications to relevant parties.
 * Possible statuses: 'Pending Review', 'Changes Needed', 'Denied', 'Cancelled',
 * 'Pending Reservations', 'Pending Accounting Approval', 'In Progress',
 * 'Pending Vouchers Approval', 'Pending Refund Approval', 'Completed'.
 * Authors: Original Monarca team
 * Last Modification made:
 * 25/02/2026 [Juan Pablo Narchi Capote] Added detailed comments and documentation for clarity and maintainability.
 */

import {
  Injectable,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Request as RequestEntity } from './entities/request.entity';
import { RequestInterface } from 'src/guards/interfaces/request.interface';
import { RequestsService } from './requests.service';
import { ApproveRequestDTO } from './dto/approve-request.dto';
import { TravelAgenciesChecks } from 'src/travel-agencies/travel-agencies.checks';
import { NotificationsService } from 'src/notifications/notifications.service';

@Injectable()
export class RequestsStatusService {
  constructor(
    @InjectRepository(RequestEntity)
    private readonly requestsRepo: Repository<RequestEntity>,
    private readonly requestsService: RequestsService,
    private readonly notificationsService: NotificationsService,
    private readonly travelAgenciesChecks: TravelAgenciesChecks,
  ) {}

  /**
   * approve, approves a travel request by the assigned admin. Validates the travel agency ID,
   * checks that the user is the assigned admin, and that the request is in "Pending Review" status.
   * Assigns the travel agency, notifies the request owner and the travel agency agents, then
   * transitions the status to "Pending Reservations".
   * Input: req (RequestInterface) - the authenticated request with session info,
   *        id_request (string) - UUID of the request to approve,
   *        data (ApproveRequestDTO) - contains id_travel_agency to assign.
   * Output: the updated Request entity with status "Pending Reservations".
   */
  async approve(
    req: RequestInterface,
    id_request: string,
    data: ApproveRequestDTO,
  ) {
    const id_user = req.sessionInfo.id;
    const id_travel_agency = data.id_travel_agency;
    const request = await this.requestsRepo.findOne({
      where: { id: id_request },
      relations: ['user'],
    });

    if (!request) throw new NotFoundException('Invalid request id');

    //CHECAR SI ES VALIDO EL TRAVEL AGENCY ID
    if (!(await this.travelAgenciesChecks.Exists(id_travel_agency)))
      throw new BadRequestException('Invalid travel agency id.');

    if (request.id_admin !== id_user)
      throw new UnauthorizedException('Unable to approve request.');

    if (request.status !== 'Pending Review')
      throw new ConflictException(
        'Unable to approve because of the requests current status.',
      );

    await this.requestsRepo.update(
      { id: id_request },
      { id_travel_agency: id_travel_agency },
    );
    
    await this.notificationsService.notify(
      request.user.email,
      'Solicitud de viaje aprobada',
      `Tu solicitud de viaje con el título "${request.title}" ha sido aprobada y está pendiente de reservaciones.`,
      `<p>Hola ${request.user.name},</p>
<p>Tu solicitud de viaje con el título "<strong>${request.title}</strong>" ha sido aprobada y está pendiente de reservaciones.</p>
<p>Por favor, espera a que se realicen las reservaciones necesarias.</p>
<p>Saludos,</p>
<p>Equipo de Monarca</p>`,
    );

    // notify to the travel agents
    const agents = await this.travelAgenciesChecks.getTravelAgencyUsers(id_travel_agency);

    for (const agent of agents) {
      await this.notificationsService.notify(
        agent.email,
        'Nueva solicitud de viaje aprobada',
        `La solicitud de viaje con el título "${request.title}" ha sido aprobada y está pendiente de reservaciones.`,
        `<p>Hola ${agent.name},</p>
<p>La solicitud de viaje con el título "<strong>${request.title}</strong>" ha sido aprobada y está pendiente de reservaciones.</p>
<p>Por favor, revisa los detalles de la solicitud y procede con las reservaciones necesarias.</p>
<p>Saludos,</p>
<p>Equipo de Monarca</p>`,
      );
    }

    return await this.requestsService.updateStatus(
      id_request,
      'Pending Reservations',
    );
  }

  /**
   * deny, denies a travel request by the assigned admin. Validates that the user is
   * the assigned admin and that the request is in "Pending Review" status. Notifies
   * the request owner and transitions the status to "Denied".
   * Input: req (RequestInterface) - the authenticated request with session info,
   *        id_request (string) - UUID of the request to deny.
   * Output: the updated Request entity with status "Denied".
   */
  async deny(req: RequestInterface, id_request: string) {
    const id_user = req.sessionInfo.id;
    const request = await this.requestsRepo.findOne({
      where: { id: id_request },
      relations: ['user'],
    });

    if (!request) throw new NotFoundException('Invalid request id');

    if (request.id_admin !== id_user)
      throw new UnauthorizedException('Unable to deny request.');

    if (request.status !== 'Pending Review')
      throw new ConflictException(
        'Unable to deny because of the requests current status.',
      );

    await this.notificationsService.notify(
      request.user.email,
      'Solicitud de viaje denegada',
      `Tu solicitud de viaje con el título "${request.title}" ha sido denegada.`,
      `<p>Hola ${request.user.name},</p>
<p>Tu solicitud de viaje con el título "<strong>${request.title}</strong>" ha sido denegada.</p>
<p>Por favor, revisa los detalles de tu solicitud y considera realizar los cambios necesarios.</p>
<p>Saludos,</p>
<p>Equipo de Monarca</p>`,
    );

    return await this.requestsService.updateStatus(id_request, 'Denied');
  }

  /**
   * cancel, cancels a travel request by the request owner. Validates that the user
   * owns the request and that the status is "Pending Review" or "Changes Needed".
   * Notifies the user and transitions the status to "Cancelled".
   * Input: req (RequestInterface) - the authenticated request with session info,
   *        id_request (string) - UUID of the request to cancel.
   * Output: the updated Request entity with status "Cancelled".
   */
  async cancel(req: RequestInterface, id_request: string) {
    const id_user = req.sessionInfo.id;
    const request = await this.requestsRepo.findOne({
      where: { id: id_request },
      relations: ['user'],
    });

    if (!request) throw new NotFoundException('Invalid request id');

    if (request.id_user !== id_user)
      throw new UnauthorizedException('Unable to cancel request.');

    if (
      request.status !== 'Pending Review' &&
      request.status !== 'Changes Needed'
    )
      throw new ConflictException(
        'Unable to cancel because of the requests current status.',
      );

      await this.notificationsService.notify(
        request.user.email,
        'Solicitud de viaje cancelada',
        `Tu solicitud de viaje con el título "${request.title}" ha sido cancelada.`,
        `<p>Hola ${request.user.name},</p>
<p>Tu solicitud de viaje con el título "<strong>${request.title}</strong>" ha sido cancelada.</p>
<p>Si tienes alguna pregunta o necesitas más información, no dudes en contactarnos.</p>
<p>Saludos,</p>
<p>Equipo de Monarca</p>`,
      );

    return await this.requestsService.updateStatus(id_request, 'Cancelled');
  }

  /**
   * finishedReservations, marks that the travel agency has completed all reservations
   * for the request. Validates that the user belongs to the assigned travel agency and
   * that the request is in "Pending Reservations" status. Notifies the SOI and transitions
   * the status to "Pending Accounting Approval".
   * Input: req (RequestInterface) - the authenticated request with session/user info,
   *        id_request (string) - UUID of the request.
   * Output: the updated Request entity with status "Pending Accounting Approval".
   */
  async finishedReservations(req: RequestInterface, id_request: string) {
    const id_travel_agency = req.userInfo.id_travel_agency;

    const request = await this.requestsRepo.findOne({
      where: { id: id_request },
      relations: ['SOI'],
    });

    if (!request) throw new NotFoundException('Invalid request id');

    
    // console.log("Scenario 1: ")
    // console.log (`(!(id_travel_agency && id_travel_agency === request.id_travel_agency)) ${(!(id_travel_agency && id_travel_agency === request.id_travel_agency))}`)
    // console.log("Scenario 2: ")
    // console.log (` (!!id_travel_agency && id_travel_agency !== request.id_travel_agency) ${ (!!id_travel_agency && id_travel_agency !== request.id_travel_agency)}`)
    
    if  (!(id_travel_agency && id_travel_agency === request.id_travel_agency)) //Testear mas
      throw new UnauthorizedException('Unable to change requests status.')

    if (request.status !== 'Pending Reservations')
      throw new ConflictException(
        'Unable to change status because of the requests current status.',
      );

    // Notify SOI
    await this.notificationsService.notify(
      request.SOI.email,
      'Solicitud de viaje pendiente de aprobación contable',
      `La solicitud de viaje con el título "${request.title}" ha finalizado las reservaciones y está pendiente de tu aprobación contable.`,
      `<p>Hola ${request.SOI.name},</p>
<p>La solicitud de viaje con el título "<strong>${request.title}</strong>" ha finalizado las reservaciones y está pendiente de tu aprobación contable.</p>
<p>Por favor, revisa los detalles de la solicitud y espera la aprobación contable.</p>
<p>Saludos,</p>
<p>Equipo de Monarca</p>`,
    );


    return await this.requestsService.updateStatus(
      id_request,
      'Pending Accounting Approval',
    );
  }

  /**
   * SOIApproval, SOI approves the accounting for a request. Validates that the user
   * is the assigned SOI and that the request is in "Pending Accounting Approval" status.
   * Notifies the request owner and transitions the status to "In Progress".
   * Input: req (RequestInterface) - the authenticated request with session info,
   *        id_request (string) - UUID of the request.
   * Output: the updated Request entity with status "In Progress".
   */
  async SOIApproval(req: RequestInterface, id_request: string) {
    const id_user = req.sessionInfo.id;
    const request = await this.requestsRepo.findOne({
      where: { id: id_request },
      relations: ['user'],
    });

    if (!request) throw new NotFoundException('Invalid request id');


    if (request.id_SOI !== id_user)
      throw new UnauthorizedException('Unable to approve request.');

    if (request.status !== 'Pending Accounting Approval')
      throw new ConflictException(
        'Unable to change status because of the requests current status.',
      );

    // Notify user
    await this.notificationsService.notify(
      request.user.email,
      'Solicitud de viaje aprobada contablemente',
      `Tu solicitud de viaje con el título "${request.title}" ha sido aprobada contablemente.`,
      `<p>Hola ${request.user.name},</p>
<p>Tu solicitud de viaje con el título "<strong>${request.title}</strong>" ha sido aprobada contablemente.</p>
<p>Ya puedes descargar tus reservaciones y llevar a cabo tu viaje.</p>
<p>Una vez concluyas el viaje, puedes iniciar la comprobación de gastos.</p>
<p>Saludos,</p>
<p>Equipo de Monarca</p>`,
    );

    return await this.requestsService.updateStatus(id_request, 'In Progress');
  }

  /**
   * finishedUploadingVouchers, marks that the request owner has finished uploading
   * expense vouchers. Validates that the user owns the request and that the status is
   * "In Progress". Notifies the assigned admin and transitions the status to
   * "Pending Vouchers Approval".
   * Input: req (RequestInterface) - the authenticated request with session info,
   *        id_request (string) - UUID of the request.
   * Output: the updated Request entity with status "Pending Vouchers Approval".
   */
  async finishedUploadingVouchers(req: RequestInterface, id_request: string) {
    const id_user = req.sessionInfo.id;
    const request = await this.requestsRepo.findOne({
      where: { id: id_request },
      relations: ['admin'],
    });

    if (!request) throw new NotFoundException('Invalid request id');

    if (request.id_user !== id_user)
      throw new UnauthorizedException('Unable to change status on request.');

    if (request.status !== 'In Progress')
      throw new ConflictException(
        'Unable to change status because of the requests current status.',
      );

    // Notify admin
    await this.notificationsService.notify(
      request.admin.email,
      'Solicitud de viaje pendiente de aprobación de comprobantes',
      `La solicitud de viaje con el título "${request.title}" ha finalizado la carga de comprobantes y está pendiente de tu aprobación.`,
      `<p>Hola ${request.admin.name},</p>
<p>La solicitud de viaje con el título "<strong>${request.title}</strong>" ha finalizado la carga de comprobantes y está pendiente de tu aprobación.</p>
<p>Por favor, revisa los comprobantes cargados y procede con la aprobación.</p>
<p>Saludos,</p>
<p>Equipo de Monarca</p>`,
    );

    return await this.requestsService.updateStatus(
      id_request,
      'Pending Vouchers Approval',
    );
  }

  /**
   * finishedApprovingVouchers, marks that the admin has finished approving expense
   * vouchers. Validates that the user is the assigned admin and that the status is
   * "Pending Vouchers Approval". Notifies the request owner and the SOI, then
   * transitions the status to "Pending Refund Approval".
   * Input: req (RequestInterface) - the authenticated request with session info,
   *        id_request (string) - UUID of the request.
   * Output: the updated Request entity with status "Pending Refund Approval".
   */
  async finishedApprovingVouchers(req: RequestInterface, id_request: string) {
    const id_user = req.sessionInfo.id;
    const request = await this.requestsRepo.findOne({
      where: { id: id_request },
      relations: ['user', 'SOI'],
    });

    if (!request) throw new NotFoundException('Invalid request id');

    if (request.id_admin !== id_user)
      throw new UnauthorizedException('Unable to change status on request.');

    if (request.status !== 'Pending Vouchers Approval')
      throw new ConflictException(
        'Unable to change status because of the requests current status.',
      );

    // Notify user
    await this.notificationsService.notify(
      request.user.email,
      'Comprobación de gastos del viaje completada',
      `Tu comprobación de gastos del viaje con el título "${request.title}" ha sido completada y está pendiente de aprobación de reembolso.`,
      `<p>Hola ${request.user.name},</p>
<p>Tu solicitud de viaje con el título "<strong>${request.title}</strong>" ha sido aprobada y está pendiente de aprobación de reembolso.</p>
<p>Por favor, espera a que se realice la aprobación de reembolso.</p>
<p>Saludos,</p>
<p>Equipo de Monarca</p>`,
    );

    // Notify SOI
    await this.notificationsService.notify(
      request.SOI.email,
      'Solicitud de viaje pendiente de aprobación de reembolso',
      `La solicitud de viaje con el título "${request.title}" ha finalizado la comprobación de gastos y está pendiente de tu aprobación de reembolso.`,
      `<p>Hola ${request.SOI.name},</p>
<p>La solicitud de viaje con el título "<strong>${request.title}</strong>" ha finalizado la comprobación de gastos y está pendiente de tu aprobación de reembolso.</p>
<p>Por favor, revisa los detalles de la solicitud y procede con la aprobación de reembolso.</p>
<p>Saludos,</p>
<p>Equipo de Monarca</p>`,
    );

    return await this.requestsService.updateStatus(id_request, 'Pending Refund Approval');
  }

  /**
   * finsihedRegisteringRequest, marks the request as fully completed by the SOI.
   * Validates that the user is the assigned SOI and that the status is "Pending Refund
   * Approval". Notifies the request owner and transitions the status to "Completed".
   * Input: req (RequestInterface) - the authenticated request with session info,
   *        id_request (string) - UUID of the request.
   * Output: the updated Request entity with status "Completed".
   */
  async finsihedRegisteringRequest(req: RequestInterface, id_request: string) {
    const id_user = req.sessionInfo.id;
    const request = await this.requestsRepo.findOne({
      where: { id: id_request },
      relations: ['user'],
    });

    if (!request) throw new NotFoundException('Invalid request id');

    if (request.id_SOI !== id_user)
      throw new UnauthorizedException('Unable to change status on request.');

    if (request.status !== 'Pending Refund Approval')
      throw new ConflictException(
        'Unable to change status because of the requests current status.',
      );

    // Notify user
    await this.notificationsService.notify(
      request.user.email,
      'Solicitud de viaje completada',
      `Tu solicitud de viaje con el título "${request.title}" ha sido completada y registrada.`,
      `<p>Hola ${request.user.name},</p>
<p>Tu solicitud de viaje con el título "<strong>${request.title}</strong>" ha sido completada y registrada.</p>
<p>En breve se realizará su reembolso si aplica.</p>
<p>Gracias por utilizar Monarca para gestionar tus viajes.</p>
<p>Saludos,</p>
<p>Equipo de Monarca</p>`,
    );

    return await this.requestsService.updateStatus(id_request, 'Completed');
  }
}