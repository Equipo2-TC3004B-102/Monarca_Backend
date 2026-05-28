/**
 * FileName: requests.status.service.ts
 * Description: Service for request status transitions and related notifications.
 * Authors: Original Monarca team
 * Last Modification made:
 * 27/05/2026 [Julio Rodriguez] Moved voucher approval to is_approver. Added refund routing in finishedUploadingVouchers, finishedReservations;
 *                              Routing uses advance_money; query now includes applies_to='all' levels;
 *                              Added request_logs entries for voucher-related transitions: finishedUploadingVouchers, finishedApprovingVouchers and finishedRegisteringRequest.
 */

import {
  Injectable,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, LessThanOrEqual, MoreThanOrEqual, Or, Repository } from 'typeorm';
import { Request as RequestEntity } from './entities/request.entity';
import { User } from 'src/users/entities/user.entity';
import { RequestInterface } from 'src/guards/interfaces/request.interface';
import { RequestsService } from './requests.service';
import { ApproveRequestDTO } from './dto/approve-request.dto';
import { TravelAgenciesChecks } from 'src/travel-agencies/travel-agencies.checks';
import { NotificationsService } from 'src/notifications/notifications.service';
import { NotificationType } from 'src/notifications/notification-types';
import { UserLogsService } from 'src/user-logs/user-logs.service';
import { ApprovalLevel } from 'src/approval-engine/entities/approval-level.entity';
import { ApprovalLevelActor } from 'src/approval-engine/entities/approval-level-actor.entity';
import { RequestLog } from 'src/request-logs/entities/request-log.entity';

// STATUSES:
// ['Pending Review', 'Changes Needed', 'Denied', 'Cancelled', 'Pending Reservations',  'Pending Accounting Approval', 'In Progress',  'Pending Vouchers Approval', 'Completed]

@Injectable()
export class RequestsStatusService {
  constructor(
    @InjectRepository(RequestEntity)
    private readonly requestsRepo: Repository<RequestEntity>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(ApprovalLevel)
    private readonly approvalLevelRepo: Repository<ApprovalLevel>,
    @InjectRepository(RequestLog)
    private readonly requestLogRepo: Repository<RequestLog>,
    private readonly requestsService: RequestsService,
    private readonly notificationsService: NotificationsService,
    private readonly travelAgenciesChecks: TravelAgenciesChecks,
    private readonly userLogsService: UserLogsService,
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
      relations: ['user', 'SOI', 'admin'],
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
      relations: ['user', 'admin'],
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

    void this.userLogsService.create({
      id_user: request.id_user,
      ip: req.ip,
      report: `REQUEST_CANCELLED§${folio}§${request.title}§${request.id}`,
    });

    return await this.requestsService.updateStatus(id_request, 'Cancelled');
  }

  async finishedReservations(req: RequestInterface, id_request: string) {
    const id_travel_agency = req.userInfo.id_travel_agency;
    const isTravelAgent = req.userInfo?.is_travelAgent === true;

    const request = await this.requestsRepo.findOne({
      where: { id: id_request },
      relations: ['user', 'requests_destinations', 'company'],
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

    // Compute the voucher submission deadline to include in the In Progress notification.
    const lastDest = (request.requests_destinations ?? []).find(d => d.is_last_destination);
    const deadlineDays = request.company?.voucher_deadline_days ?? 7;
    const deadlineDate = lastDest
      ? new Date(new Date(lastDest.arrival_date).getTime() + deadlineDays * 24 * 60 * 60 * 1000)
      : null;
    const deadlineStr = deadlineDate
      ? deadlineDate.toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' })
      : `${deadlineDays} días después del regreso`;

    // Notify user once reservations are completed, including the expense submission deadline.
    const folio = `${new Date(request.createdAt).getFullYear()}-${String(request.request_num).padStart(3, '0')}`;

    await this.notificationsService.notify(
      request.user.email,
      `Reservaciones de viaje completadas — Folio ${folio}`,
      `La agencia de viajes completó las reservaciones de la solicitud (Folio: ${folio}, Título: "${request.title}"). Tienes hasta el ${deadlineStr} para enviar tus comprobantes de gastos.`,
      `<p>Hola ${request.user.name},</p>
       <p>La agencia de viajes completó las reservaciones de tu solicitud.</p>
       <p><strong>Folio:</strong> ${folio}<br><strong>Título:</strong> ${request.title}</p>
       <p>Tu solicitud pasa ahora a estado de viaje en progreso.</p>
       <p><strong>⚠ Importante:</strong> Tienes hasta el <strong>${deadlineStr}</strong> (${deadlineDays} días después del regreso) para subir y enviar tus comprobantes de gastos.</p>
       <p>Si no envías tus comprobantes dentro del plazo, deberás reintegrar el anticipo otorgado.</p>
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
      relations: ['user', 'SOI'],
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
      relations: ['admin', 'vouchers', 'user'],
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

    // At least one pending voucher must exist before the status can be transitioned.
    const pendingVouchers = (request.vouchers ?? []).filter(v => v.status === 'pending_voucher');
    if (pendingVouchers.length === 0)
      throw this.clientError(
        'At least one voucher must be uploaded before sending for approval.',
        'REQUESTS_NO_VOUCHERS_TO_SUBMIT',
      );

    // ── Refund routing: assign approver based on the advance amount granted ──────
    // advance_money is the canonical reference for refund routing, matching the same tier ranges that were configured when the advance was approved.
    // totalAmount (actual voucher spend) is kept separately for the confirmation email.
    const totalAmount = pendingVouchers.reduce((sum, v) => sum + Number(v.amount), 0);
    const routingAmount = Number(request.advance_money);

    // Company-specific level (applies_to = 'refund' or 'all').
    // Includes the usage of global fallback rule.
    const refundAmountWhere = {
      applies_to: In(['refund', 'all']),
      is_active: true,
      min_amount_mon: Or(IsNull(), LessThanOrEqual(routingAmount)),
      max_amount_mon: Or(IsNull(), MoreThanOrEqual(routingAmount)),
    };

    let refundLevel = await this.approvalLevelRepo.findOne({
      where: { company_id: request.id_company, ...refundAmountWhere },
      relations: ['approval_level_actors'],
    });

    if (!refundLevel) {
      refundLevel = await this.approvalLevelRepo.findOne({
        where: { company_id: IsNull(), ...refundAmountWhere },
        relations: ['approval_level_actors'],
      });
    }

    // If still no match, check if any refund/all level exists in the company to determine if we should throw a hard error or just continue without routing.
    if (!refundLevel) {
      const anyRefundLevel = await this.approvalLevelRepo.findOne({
        where: [
          { company_id: request.id_company, applies_to: In(['refund', 'all']), is_active: true },
          { company_id: IsNull(), applies_to: In(['refund', 'all']), is_active: true },
        ],
        select: ['id'],
      });
      if (anyRefundLevel) {
        throw this.clientError(
          `No approval level covers $${routingAmount.toFixed(2)} MXN for refund routing. ` +
          `Configure a refund or all-type rule that includes this amount.`,
          'REQUESTS_NO_APPROVAL_LEVEL',
        );
      }
      // No refund/'all' levels configured anywhere — keep existing id_admin and continue.
    }

    let notifyApproverEmail = request.admin?.email ?? '';
    let notifyApproverName = request.admin?.name ?? 'Approver';

    if (refundLevel && (refundLevel.approval_level_actors?.length ?? 0) > 0) {
      const newApprover = await this.resolveRefundApprover(
        refundLevel.approval_level_actors,
        request.id_company,
        request.id_admin ?? undefined,
      );
      if (!newApprover) {
        throw this.clientError(
          'No eligible approver found for the matching refund level.',
          'REQUESTS_NO_ELIGIBLE_REFUND_APPROVER',
        );
      }
      if (newApprover.id !== request.id_admin) {
        await this.requestsRepo.update({ id: id_request }, { id_admin: newApprover.id });
      }
      notifyApproverEmail = newApprover.email;
      notifyApproverName = newApprover.name;
    }

    // Notify the (possibly newly routed) approver.
    const folio = `${new Date(request.createdAt).getFullYear()}-${String(request.request_num).padStart(3, '0')}`;
    const totalAmountFormatted = totalAmount.toLocaleString('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 2 });

    await this.notificationsService.notify(
      notifyApproverEmail,
      `Solicitud de viaje pendiente de aprobación de comprobantes — Folio ${folio}`,
      `La solicitud de viaje (Folio: ${folio}, Título: "${request.title}") ha finalizado la carga de comprobantes y está pendiente de tu aprobación.`,
      `<p>Hola ${notifyApproverName},</p>
       <p>La solicitud de viaje ha finalizado la carga de comprobantes y está pendiente de tu aprobación.</p>
       <p><strong>Folio:</strong> ${folio}<br><strong>Título:</strong> ${request.title}</p>
       <p>Por favor, revisa los comprobantes cargados y procede con la aprobación.</p>
       <p>Saludos,</p>
       <p>Equipo de Monarca</p>`,
      { companyId: request.id_company, type: NotificationType.REQUEST_STATUS },
    );

    // Notify the requester with a confirmation and the total amount registered.
    const advanceFormatted = Number(request.advance_money).toLocaleString('es-MX', {
      style: 'currency',
      currency: request.currency ?? 'MXN',
      minimumFractionDigits: 2,
    });
    await this.notificationsService.notify(
      request.user.email,
      `Comprobantes enviados para aprobación — Folio ${folio}`,
      `Tus comprobantes de gastos de la solicitud (Folio: ${folio}) han sido enviados para revisión. Total registrado: ${totalAmountFormatted}.`,
      `<p>Hola ${request.user.name},</p>
       <p>Tus comprobantes de gastos han sido enviados exitosamente para aprobación.</p>
       <p><strong>Folio:</strong> ${folio}<br><strong>Título:</strong> ${request.title}</p>
       <p><strong>Total de comprobantes registrado:</strong> ${totalAmountFormatted}</p>
       <p><strong>Anticipo otorgado:</strong> ${advanceFormatted}</p>
       <p>Recibirás una notificación cuando tus comprobantes sean revisados por el aprobador.</p>
       <p>Saludos,</p>
       <p>Equipo de Monarca</p>`,
      { companyId: request.id_company, type: NotificationType.REQUEST_STATUS },
    );

    const updated = await this.requestsService.updateStatus(
      id_request,
      'Pending Vouchers Approval',
    );
    await this.requestLogRepo.save(
      this.requestLogRepo.create({
        id_request,
        id_user,
        report: `Solicitante envió ${pendingVouchers.length} comprobante(s) por un total de ${totalAmountFormatted} para aprobación.`,
        new_status: 'Pending Vouchers Approval',
      }),
    );
    return updated;
  }

  /**
   * resolveRefundApprover — Finds the first eligible user for the given actor list.
   * If actor has target_id, uses that specific user.
   * Otherwise finds any is_approver=true user in the company, filtered by ceco_id if set.
   * When no target_id is set, the current approver (currentApproverId) is preferred if they
   * still qualify — this prevents overwriting a valid assignment with an arbitrary first match.
   */
  private async resolveRefundApprover(
    actors: ApprovalLevelActor[],
    companyId: string,
    currentApproverId?: string,
  ): Promise<User | null> {
    for (const actor of actors) {
      if (actor.target_id) {
        const user = await this.userRepo.findOne({ where: { id: actor.target_id } });
        if (user) return user;
        continue;
      }
      const where: Record<string, unknown> = { is_approver: true, id_company: companyId };
      if (actor.ceco_id) where['id_ceco'] = actor.ceco_id;

      // Prefer the current approver if they still qualify for this level.
      if (currentApproverId) {
        const currentApprover = await this.userRepo.findOne({
          where: { id: currentApproverId, ...(where as object) } as any,
        });
        if (currentApprover) return currentApprover;
      }

      const user = await this.userRepo.findOne({ where: where as any });
      if (user) return user;
    }
    return null;
  }
  
  // Moves status from Pending Vouchers Approval to Pending Refund Approval.
  // Owned by the routed approver (approve_request permission).
  async finishedApprovingVouchers(req: RequestInterface, id_request: string) {
    const id_user = req.sessionInfo.id;
    const request = await this.requestsRepo.findOne({
      where: { id: id_request },
      relations: ['user', 'SOI', 'admin', 'vouchers'],
    });
    if (!request)
      throw this.clientError('Invalid request id', 'REQUEST_STATUS_INVALID_ID');

    // Only the assigned approver (id_admin) can finish approving vouchers.
    if (request.id_admin !== id_user)
      throw this.clientError(
        'Unable to change status on request.',
        'REQUEST_STATUS_APPROVE_VOUCHERS_NOT_ALLOWED',
      );

    if (request.status !== 'Pending Vouchers Approval')
      throw this.clientError(
        'Unable to change status because of the requests current status.',
        'REQUEST_STATUS_APPROVE_VOUCHERS_INVALID_STATE',
      );

    const folio = `${new Date(request.createdAt).getFullYear()}-${String(request.request_num).padStart(3, '0')}`;

    // Notify requester
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

    // Notify SOI that the refund is ready for final registration.
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

    const updated = await this.requestsService.updateStatus(id_request, 'Pending Refund Approval');
    await this.requestLogRepo.save(
      this.requestLogRepo.create({
        id_request,
        id_user,
        report: `Aprobador finalizó la revisión de comprobantes.`,
        new_status: 'Pending Refund Approval',
      }),
    );
    return updated;
  }

  // Finished request registration flow
  async finsihedRegisteringRequest(req: RequestInterface, id_request: string) {
    const id_user = req.sessionInfo.id;
    const request = await this.requestsRepo.findOne({
      where: { id: id_request },
      relations: ['user', 'SOI'],
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

    const updated = await this.requestsService.updateStatus(id_request, 'Completed');
    await this.requestLogRepo.save(
      this.requestLogRepo.create({
        id_request,
        id_user,
        report: `SOI completó el registro del reembolso. Solicitud marcada como completada.`,
        new_status: 'Completed',
      }),
    );
    return updated;
  }

  /**
   * getVarianceReport - Calculates on-the-fly the budget vs. actual expense comparison for a request.
   * Input: id_request (string) - UUID of the request to compute the report for.
   * Output: Object with budget_amount, actual_amount, variance, variance_pct, currency, voucher counts.
   * Throws BadRequestException if the request is not found or not in Pending Vouchers Approval.
   */
  async getVarianceReport(id_request: string) {
    const request = await this.requestsRepo.findOne({
      where: { id: id_request },
      relations: ['vouchers'],
    });

    if (!request)
      throw this.clientError('Invalid request id', 'REQUEST_STATUS_INVALID_ID');

    if (request.status !== 'Pending Vouchers Approval')
      throw this.clientError(
        'Variance report is only available when the request is in Pending Vouchers Approval.',
        'VARIANCE_REPORT_INVALID_STATE',
      );

    const approvedVouchers = (request.vouchers ?? []).filter(v => v.status === 'Voucher Approved');
    const actualAmount = approvedVouchers.reduce((sum, v) => sum + Number(v.amount), 0);
    const budgetAmount = Number(request.advance_money ?? 0);
    const variance = actualAmount - budgetAmount;
    const variancePct = budgetAmount > 0
      ? Math.round((variance / budgetAmount) * 10000) / 100
      : null;

    return {
      id_request: request.id,
      budget_amount: budgetAmount,
      actual_amount: actualAmount,
      variance,
      variance_pct: variancePct,
      currency: request.currency ?? 'MXN',
      vouchers_approved: approvedVouchers.length,
      vouchers_total: (request.vouchers ?? []).length,
    };
  }
}