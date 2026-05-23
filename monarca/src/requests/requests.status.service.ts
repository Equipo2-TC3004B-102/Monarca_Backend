/**
 * FileName: requests.status.service.ts
 * Description: Service for request status transitions and related notifications.
 * Authors: Original Monarca team
 * Last Modification made:
 * 19/05/2026 [Julio Rodriguez] Added folio (YYYY-NNN) to all notification email subjects and bodies.
 */

import {
  Injectable,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Request as RequestEntity } from './entities/request.entity';
import { User } from 'src/users/entities/user.entity';
import { RequestInterface } from 'src/guards/interfaces/request.interface';
import { RequestsService } from './requests.service';
import { ApproveRequestDTO } from './dto/approve-request.dto';
import { TravelAgenciesChecks } from 'src/travel-agencies/travel-agencies.checks';
import { NotificationsService } from 'src/notifications/notifications.service';
import { NotificationType } from 'src/notifications/notification-types';

// STATUSES:
// ['Pending Review', 'Changes Needed', 'Denied', 'Cancelled', 'Pending Reservations',  'Pending Accounting Approval', 'In Progress',  'Pending Vouchers Approval', 'Completed]

@Injectable()
export class RequestsStatusService {
  constructor(
    @InjectRepository(RequestEntity)
    private readonly requestsRepo: Repository<RequestEntity>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly requestsService: RequestsService,
    private readonly notificationsService: NotificationsService,
    private readonly travelAgenciesChecks: TravelAgenciesChecks,
  ) {}

  private clientError(message: string, code: string) {
    return new BadRequestException({ message, code });
  }

  async approve(
    req: RequestInterface,
    id_request: string,
    data: ApproveRequestDTO,
  ) {
    const id_user = req.sessionInfo.id;
    const id_travel_agency = data.id_travel_agency;
    const request = await this.requestsRepo.findOne({
      where: { id: id_request },
      relations: ['user', 'SOI'],
    });
    if (!request)
      throw this.clientError('Invalid request id', 'REQUEST_STATUS_INVALID_ID');

    // Validate travel agency id
    if (!(await this.travelAgenciesChecks.exists(id_travel_agency)))
      throw this.clientError(
        'Invalid travel agency id.',
        'REQUEST_STATUS_INVALID_TRAVEL_AGENCY',
      );

    if (request.id_admin !== id_user)
      throw this.clientError(
        'Unable to approve request.',
        'REQUEST_STATUS_APPROVE_NOT_ALLOWED',
      );

    if (request.status !== 'Pending Review')
      throw this.clientError(
        'Unable to approve because of the requests current status.',
        'REQUEST_STATUS_APPROVE_INVALID_STATE',
      );

    await this.requestsRepo.update(
      { id: id_request },
      { id_travel_agency: id_travel_agency },
    );

    const folio = `${new Date(request.createdAt).getFullYear()}-${String(request.request_num).padStart(3, '0')}`;

    await this.notificationsService.notify(
      request.user.email,
      `Solicitud de viaje aprobada — Folio ${folio}`,
      `Tu solicitud de viaje (Folio: ${folio}, Título: "${request.title}") ha sido aprobada y está pendiente de aprobación de presupuesto por SOI.`,
      `<p>Hola ${request.user.name},</p>
       <p>Tu solicitud de viaje ha sido aprobada y está pendiente de aprobación de presupuesto por SOI.</p>
       <p><strong>Folio:</strong> ${folio}<br><strong>Título:</strong> ${request.title}</p>
       <p>Una vez aprobada por SOI, la agencia de viajes podrá continuar con las reservaciones.</p>
       <p>Saludos,</p>
       <p>Equipo de Monarca</p>`,
      { companyId: request.id_company, type: NotificationType.REQUEST_STATUS },
    );

    // Notify SOI to review budget before reservations.
    await this.notificationsService.notify(
      request.SOI.email,
      `Solicitud de viaje pendiente de aprobación de presupuesto — Folio ${folio}`,
      `La solicitud de viaje (Folio: ${folio}, Título: "${request.title}") fue aprobada y está pendiente de tu revisión de presupuesto.`,
      `<p>Hola ${request.SOI.name},</p>
       <p>La solicitud de viaje fue aprobada y está pendiente de tu revisión de presupuesto.</p>
       <p><strong>Folio:</strong> ${folio}<br><strong>Título:</strong> ${request.title}</p>
       <p>Por favor, revisa la información para continuar el flujo.</p>
       <p>Saludos,</p>
       <p>Equipo de Monarca</p>`,
      { companyId: request.id_company, type: NotificationType.REQUEST_STATUS },
    );

    return await this.requestsService.updateStatus(
      id_request,
      'Pending Accounting Approval',
    );
  }

  async deny(req: RequestInterface, id_request: string) {
    const id_user = req.sessionInfo.id;
    const request = await this.requestsRepo.findOne({
      where: { id: id_request },
      relations: ['user'],
    });
    if (!request)
      throw this.clientError('Invalid request id', 'REQUEST_STATUS_INVALID_ID');

    if (request.id_admin !== id_user)
      throw this.clientError(
        'Unable to deny request.',
        'REQUEST_STATUS_DENY_NOT_ALLOWED',
      );

    if (request.status !== 'Pending Review')
      throw this.clientError(
        'Unable to deny because of the requests current status.',
        'REQUEST_STATUS_DENY_INVALID_STATE',
      );

    const folio = `${new Date(request.createdAt).getFullYear()}-${String(request.request_num).padStart(3, '0')}`;
    await this.notificationsService.notify(
      request.user.email,
      `Solicitud de viaje denegada — Folio ${folio}`,
      `Tu solicitud de viaje (Folio: ${folio}, Título: "${request.title}") ha sido denegada.`,
      `<p>Hola ${request.user.name},</p>
       <p>Tu solicitud de viaje ha sido denegada.</p>
       <p><strong>Folio:</strong> ${folio}<br><strong>Título:</strong> ${request.title}</p>
       <p>Por favor, revisa los detalles de tu solicitud y considera realizar los cambios necesarios.</p>
       <p>Saludos,</p>
       <p>Equipo de Monarca</p>`,
      { companyId: request.id_company, type: NotificationType.REQUEST_STATUS },
    );

    return await this.requestsService.updateStatus(id_request, 'Denied');
  }

  async cancel(req: RequestInterface, id_request: string) {
    const id_user = req.sessionInfo.id;
    const request = await this.requestsRepo.findOne({
      where: { id: id_request },
      relations: ['user'],
    });
    if (!request)
      throw this.clientError('Invalid request id', 'REQUEST_STATUS_INVALID_ID');

    if (request.id_user !== id_user)
      throw this.clientError(
        'Unable to cancel request.',
        'REQUEST_STATUS_CANCEL_NOT_ALLOWED',
      );

    // Approvers cannot cancel a request assigned to them, even if they also have is_requester.
    if (request.id_admin === id_user)
      throw this.clientError(
        'Unable to cancel a request assigned for your approval.',
        'REQUEST_STATUS_CANCEL_NOT_ALLOWED',
      );

    if (
      request.status !== 'Pending Review' &&
      request.status !== 'Changes Needed'
    )
      throw this.clientError(
        'Unable to cancel because of the requests current status.',
        'REQUEST_STATUS_CANCEL_INVALID_STATE',
      );

      const folio = `${new Date(request.createdAt).getFullYear()}-${String(request.request_num).padStart(3, '0')}`;
      await this.notificationsService.notify(
        request.user.email,
        `Solicitud de viaje cancelada — Folio ${folio}`,
        `Tu solicitud de viaje (Folio: ${folio}, Título: "${request.title}") ha sido cancelada.`,
        `<p>Hola ${request.user.name},</p>
         <p>Tu solicitud de viaje ha sido cancelada.</p>
         <p><strong>Folio:</strong> ${folio}<br><strong>Título:</strong> ${request.title}</p>
         <p>Si tienes alguna pregunta o necesitas más información, no dudes en contactarnos.</p>
         <p>Saludos,</p>
         <p>Equipo de Monarca</p>`,
        { companyId: request.id_company, type: NotificationType.REQUEST_STATUS },
      );

    return await this.requestsService.updateStatus(id_request, 'Cancelled');
  }

  async finishedReservations(req: RequestInterface, id_request: string) {
    const id_travel_agency = req.userInfo.id_travel_agency;
    const isTravelAgent = req.userInfo?.is_travelAgent === true;

    const request = await this.requestsRepo.findOne({
      where: { id: id_request },
      relations: ['user'],
    });

    if (!request)
      throw this.clientError('Invalid request id', 'REQUEST_STATUS_INVALID_ID');
    
    // Allow access if:
    // - User is a travel agent (regardless of agency assignment)
    // - User's agency matches the request's agency
    const canFinishReservations = isTravelAgent || (id_travel_agency && id_travel_agency === request.id_travel_agency);
    
    if (!canFinishReservations)
      throw this.clientError(
        'Unable to change requests status.',
        'REQUEST_STATUS_TRANSITION_NOT_ALLOWED',
      );

    if (request.status !== 'Pending Reservations')
      throw this.clientError(
        'Unable to change status because of the requests current status.',
        'REQUEST_STATUS_TRANSITION_INVALID_STATE',
      );

    // Notify user once reservations are completed.
    const folio = `${new Date(request.createdAt).getFullYear()}-${String(request.request_num).padStart(3, '0')}`;
    await this.notificationsService.notify(
      request.user.email,
      `Reservaciones de viaje completadas — Folio ${folio}`,
      `La agencia de viajes completó las reservaciones de la solicitud (Folio: ${folio}, Título: "${request.title}").`,
      `<p>Hola ${request.user.name},</p>
       <p>La agencia de viajes completó las reservaciones de tu solicitud.</p>
       <p><strong>Folio:</strong> ${folio}<br><strong>Título:</strong> ${request.title}</p>
       <p>Tu solicitud pasa ahora a estado de viaje en progreso.</p>
       <p>Saludos,</p>
       <p>Equipo de Monarca</p>`,
      { companyId: request.id_company, type: NotificationType.RESERVATION_CREATED },
    );


    return await this.requestsService.updateStatus(
      id_request,
      'In Progress',
    );
  }

  async SOIApproval(req: RequestInterface, id_request: string) {
    const id_user = req.sessionInfo.id;
    const request = await this.requestsRepo.findOne({
      where: { id: id_request },
      relations: ['user'],
    });
    if (!request)
      throw this.clientError('Invalid request id', 'REQUEST_STATUS_INVALID_ID');


    if (request.id_SOI !== id_user)
      throw this.clientError(
        'Unable to approve request.',
        'REQUEST_STATUS_SOI_APPROVE_NOT_ALLOWED',
      );

    if (request.status !== 'Pending Accounting Approval')
      throw this.clientError(
        'Unable to change status because of the requests current status.',
        'REQUEST_STATUS_SOI_APPROVE_INVALID_STATE',
      );

    if (!request.id_travel_agency)
      throw this.clientError(
        'Unable to route request because travel agency is not assigned.',
        'REQUEST_STATUS_TRAVEL_AGENCY_REQUIRED',
      );

    const folio = `${new Date(request.createdAt).getFullYear()}-${String(request.request_num).padStart(3, '0')}`;
    const updated = await this.requestsService.updateStatus(id_request, 'Pending Reservations');

    // Fire-and-forget: send notifications after responding to avoid request timeout
    void (async () => {
      this.notificationsService.notify(
        request.user.email,
        `Solicitud de viaje aprobada contablemente — Folio ${folio}`,
        `Tu solicitud de viaje (Folio: ${folio}, Título: "${request.title}") ha sido aprobada contablemente y será enviada a reservaciones.`,
        `<p>Hola ${request.user.name},</p>
         <p>Tu solicitud de viaje ha sido aprobada contablemente.</p>
         <p><strong>Folio:</strong> ${folio}<br><strong>Título:</strong> ${request.title}</p>
         <p>La agencia de viajes recibirá ahora la solicitud para realizar las reservaciones.</p>
         <p>Saludos,</p>
         <p>Equipo de Monarca</p>`,
        { companyId: request.id_company, type: NotificationType.REQUEST_STATUS },
      );

      let agents = await this.travelAgenciesChecks.getTravelAgencyUsers(request.id_travel_agency!);
      if (agents.length === 0) {
        agents = await this.userRepo.find({ where: { is_travelAgent: true } });
      }
      for (const agent of agents) {
        this.notificationsService.notify(
          agent.email,
          `Solicitud lista para reservaciones — Folio ${folio}`,
          `La solicitud de viaje (Folio: ${folio}, Título: "${request.title}") fue aprobada por SOI y está lista para reservaciones.`,
          `<p>Hola ${agent.name},</p>
           <p>La solicitud de viaje fue aprobada por SOI y está lista para reservaciones.</p>
           <p><strong>Folio:</strong> ${folio}<br><strong>Título:</strong> ${request.title}</p>
           <p>Por favor, revisa la solicitud y procede con la reservación.</p>
           <p>Saludos,</p>
           <p>Equipo de Monarca</p>`,
          { companyId: request.id_company, type: NotificationType.REQUEST_STATUS },
        );
      }
    })();

    return updated;
  }

  async finishedUploadingVouchers(req: RequestInterface, id_request: string) {
    const id_user = req.sessionInfo.id;
    const request = await this.requestsRepo.findOne({
      where: { id: id_request },
      relations: ['admin'],
    });
    if (!request)
      throw this.clientError('Invalid request id', 'REQUEST_STATUS_INVALID_ID');

    if (request.id_user !== id_user)
      throw this.clientError(
        'Unable to change status on request.',
        'REQUEST_STATUS_UPLOAD_VOUCHERS_NOT_ALLOWED',
      );

    if (request.status !== 'In Progress')
      throw this.clientError(
        'Unable to change status because of the requests current status.',
        'REQUEST_STATUS_UPLOAD_VOUCHERS_INVALID_STATE',
      );

    // Notify admin
    const folio = `${new Date(request.createdAt).getFullYear()}-${String(request.request_num).padStart(3, '0')}`;
    await this.notificationsService.notify(
      request.admin.email,
      `Solicitud de viaje pendiente de aprobación de comprobantes — Folio ${folio}`,
      `La solicitud de viaje (Folio: ${folio}, Título: "${request.title}") ha finalizado la carga de comprobantes y está pendiente de tu aprobación.`,
      `<p>Hola ${request.admin.name},</p>
       <p>La solicitud de viaje ha finalizado la carga de comprobantes y está pendiente de tu aprobación.</p>
       <p><strong>Folio:</strong> ${folio}<br><strong>Título:</strong> ${request.title}</p>
       <p>Por favor, revisa los comprobantes cargados y procede con la aprobación.</p>
       <p>Saludos,</p>
       <p>Equipo de Monarca</p>`,
      { companyId: request.id_company, type: NotificationType.REQUEST_STATUS },
    );

    return await this.requestsService.updateStatus(
      id_request,
      'Pending Vouchers Approval',
    );
  }
  
  // Changes final status from Completed to Pending Refund Approval.
  async finishedApprovingVouchers(req: RequestInterface, id_request: string) {
    const id_user = req.sessionInfo.id;
    const request = await this.requestsRepo.findOne({
      where: { id: id_request },
      relations: ['user', 'SOI'],
    });
    if (!request)
      throw this.clientError('Invalid request id', 'REQUEST_STATUS_INVALID_ID');

    // Allow the request admin or any user with the `approve_vouchers` permission
    // (e.g., SOI or roles mapped in the permissions guard) to finish approving vouchers.
    if (request.id_admin !== id_user && !req.userPermissions?.includes('approve_vouchers'))
      throw this.clientError(
        'Unable to change status on request.',
        'REQUEST_STATUS_APPROVE_VOUCHERS_NOT_ALLOWED',
      );

    if (request.status !== 'Pending Vouchers Approval')
      throw this.clientError(
        'Unable to change status because of the requests current status.',
        'REQUEST_STATUS_APPROVE_VOUCHERS_INVALID_STATE',
      );

    // Notify user
    const folio = `${new Date(request.createdAt).getFullYear()}-${String(request.request_num).padStart(3, '0')}`;
    await this.notificationsService.notify(
      request.user.email,
      `Comprobación de gastos del viaje completada — Folio ${folio}`,
      `Tu comprobación de gastos del viaje (Folio: ${folio}, Título: "${request.title}") ha sido completada y está pendiente de aprobación de reembolso.`,
      `<p>Hola ${request.user.name},</p>
       <p>Tu solicitud de viaje ha sido aprobada y está pendiente de aprobación de reembolso.</p>
       <p><strong>Folio:</strong> ${folio}<br><strong>Título:</strong> ${request.title}</p>
       <p>Por favor, espera a que se realice la aprobación de reembolso.</p>
       <p>Saludos,</p>
       <p>Equipo de Monarca</p>`,
      { companyId: request.id_company, type: NotificationType.REQUEST_STATUS },
    );

    // Notify SOI
    await this.notificationsService.notify(
      request.SOI.email,
      `Solicitud de viaje pendiente de aprobación de reembolso — Folio ${folio}`,
      `La solicitud de viaje (Folio: ${folio}, Título: "${request.title}") ha finalizado la comprobación de gastos y está pendiente de tu aprobación de reembolso.`,
      `<p>Hola ${request.SOI.name},</p>
       <p>La solicitud de viaje ha finalizado la comprobación de gastos y está pendiente de tu aprobación de reembolso.</p>
       <p><strong>Folio:</strong> ${folio}<br><strong>Título:</strong> ${request.title}</p>
       <p>Por favor, revisa los detalles de la solicitud y procede con la aprobación de reembolso.</p>
       <p>Saludos,</p>
      <p>Equipo de Monarca</p>`,
      { companyId: request.id_company, type: NotificationType.REQUEST_STATUS },
    );

    return await this.requestsService.updateStatus(id_request, 'Pending Refund Approval');
  }

  // Finished request registration flow
  async finsihedRegisteringRequest(req: RequestInterface, id_request: string) {
    const id_user = req.sessionInfo.id;
    const request = await this.requestsRepo.findOne({
      where: { id: id_request },
      relations: ['user'],
    });
    if (!request)
      throw this.clientError('Invalid request id', 'REQUEST_STATUS_INVALID_ID');

    if (request.id_SOI !== id_user)
      throw this.clientError(
        'Unable to change status on request.',
        'REQUEST_STATUS_COMPLETE_NOT_ALLOWED',
      );

    if (request.status !== 'Pending Refund Approval')
      throw this.clientError(
        'Unable to change status because of the requests current status.',
        'REQUEST_STATUS_COMPLETE_INVALID_STATE',
      );

    // Notify user
    const folio = `${new Date(request.createdAt).getFullYear()}-${String(request.request_num).padStart(3, '0')}`;
    await this.notificationsService.notify(
      request.user.email,
      `Solicitud de viaje completada — Folio ${folio}`,
      `Tu solicitud de viaje (Folio: ${folio}, Título: "${request.title}") ha sido completada y registrada.`,
      `<p>Hola ${request.user.name},</p>
       <p>Tu solicitud de viaje ha sido completada y registrada.</p>
       <p><strong>Folio:</strong> ${folio}<br><strong>Título:</strong> ${request.title}</p>
       <p>En breve se realizará su reembolso si aplica.</p>
       <p>Gracias por utilizar Monarca para gestionar tus viajes.</p>
       <p>Saludos,</p>
       <p>Equipo de Monarca</p>`,
      { companyId: request.id_company, type: NotificationType.REQUEST_STATUS },
    );

    return await this.requestsService.updateStatus(id_request, 'Completed');
  }
}