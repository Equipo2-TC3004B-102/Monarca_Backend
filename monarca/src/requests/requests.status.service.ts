/**
 * FileName: requests.status.service.ts
 * Description: Service for request status transitions and related notifications.
 * Authors: Original Monarca team
 * Last Modification made:
 * 01/06/2026 [Julio Rodriguez] Replaced actor-based refund routing with manager chain traversal (resolveManagerChainApprover).
 *                              Company-specific rules now take priority over global fallback via level_order ASC ordering.
 *                              Requests at the root of the manager chain bypass voucher approval and go directly to SOI.
 * 02/06/2026 [Julio Rodriguez] Multi-level approval in approve(): after each level completes, routes to the next
 *                              ApprovalLevel (higher level_order) before advancing to SOI. Also supports
 *                              required_approvals > 1 within a level by walking up the manager chain for each step.
 *                              id_travel_agency is now only required on the final approval.
 */

import {
  Injectable,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, LessThanOrEqual, MoreThan, MoreThanOrEqual, Or, Repository } from 'typeorm';
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
import { RequestApproval } from 'src/approval-engine/entities/request-approval.entity';
import { RequestLog } from 'src/request-logs/entities/request-log.entity';
import { UserChecks } from 'src/users/user.checks.service';

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
    @InjectRepository(RequestApproval)
    private readonly requestApprovalRepo: Repository<RequestApproval>,
    private readonly requestsService: RequestsService,
    private readonly notificationsService: NotificationsService,
    private readonly travelAgenciesChecks: TravelAgenciesChecks,
    private readonly userLogsService: UserLogsService,
    private readonly userChecks: UserChecks,
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
    const request = await this.requestsRepo.findOne({
      where: { id: id_request },
      relations: ['user', 'SOI', 'admin'],
    });
    if (!request)
      throw this.clientError('Invalid request id', 'REQUEST_STATUS_INVALID_ID');

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

    const folio = `${new Date(request.createdAt).getFullYear()}-${String(request.request_num).padStart(3, '0')}`;

    // Mark the active PENDING RequestApproval record as APPROVED.
    await this.requestApprovalRepo.update(
      { request_id: id_request, approver_user_id: id_user, status: 'PENDING' },
      { decision: 'APPROVED', status: 'APPROVED', decided_at: new Date() },
    );

    const currentLevel = request.current_approval_level_id
      ? await this.approvalLevelRepo.findOne({ where: { id: request.current_approval_level_id }, relations: ['approval_level_actors'] })
      : null;

    const newApprovalCount = (request.approval_count ?? 0) + 1;
    const requiredApprovals = currentLevel?.required_approvals ?? 1;

    // ── Case A: current level needs more approvals — find the next approver ──
    if (newApprovalCount < requiredApprovals) {
      // Specific-user levels route through the staged user list (not the manager chain),
      // so only the configured approvers participate. MANAGER levels walk the chain.
      const userActors = (currentLevel?.approval_level_actors ?? []).filter((a) => a.target_id);
      let nextAdminId: string | null = null;
      let nextActorId: string | null = null;
      if (userActors.length > 0) {
        // approval_count doubles as the index into the eligible staged list: element [0] was the
        // first approver, so after N approvals the next is element [N] (= newApprovalCount).
        const eligibleStaged = await this.eligibleStagedActors(userActors, request.id_company, request.id_user);
        const nextStaged = eligibleStaged[newApprovalCount];
        nextAdminId = nextStaged?.target_id ?? null;
        nextActorId = nextStaged?.id ?? null;
      } else {
        nextAdminId = await this.userChecks.getChainFallbackApprover(id_user, request.id_company);
      }
      if (nextAdminId) {
        await this.requestApprovalRepo.save({
          request_id: id_request,
          approval_level_id: currentLevel!.id,
          approval_actor_id: nextActorId,
          approver_user_id: nextAdminId,
          decision: 'PENDING',
          status: 'PENDING',
          amount_snapshot: Number(request.advance_money),
          currency_snapshot: request.currency ?? 'MXN',
          escalation_step: 0,
          decided_at: null,
        });
        await this.requestsRepo.update(
          { id: id_request },
          { id_admin: nextAdminId, approval_count: newApprovalCount },
        );
        const nextAdmin = await this.userRepo.findOne({ where: { id: nextAdminId } });
        if (nextAdmin) {
          void (async () => {
            try {
              await this.notificationsService.notify(
                nextAdmin.email,
                `Solicitud de viaje pendiente de tu aprobación — Folio ${folio}`,
                `La solicitud de viaje (Folio: ${folio}, Título: "${request.title}") requiere tu aprobación.`,
                `<p>Hola ${nextAdmin.name},</p>
                 <p>La solicitud de viaje ha avanzado y requiere ahora tu revisión.</p>
                 <p><strong>Folio:</strong> ${folio}<br><strong>Título:</strong> ${request.title}</p>
                 <p>Por favor, revisa los detalles y procede con tu aprobación.</p>
                 <p>Saludos,</p>
                 <p>Equipo de Monarca</p>`,
                { companyId: request.id_company, type: NotificationType.REQUEST_STATUS },
              );
            } catch (e) {
              console.error('approve(): notification failed (case A)', e);
            }
          })();
        }
        return await this.requestsRepo.findOne({ where: { id: id_request } });
      }
      // No further approver in chain — fall through to next-level / final logic.
    }

    // ── Case B: level complete — look for the next ApprovalLevel ─────────────────────
    if (request.current_approval_level_id) {
      const amountMxn = Number(request.advance_money);
      const currentLevelOrder = currentLevel?.level_order ?? 0;

      const nextLevelWhere = {
        is_active: true,
        applies_to: In(['travel', 'all']),
        min_amount_mon: Or(IsNull(), LessThanOrEqual(amountMxn)),
        max_amount_mon: Or(IsNull(), MoreThanOrEqual(amountMxn)),
        level_order: MoreThan(currentLevelOrder),
      };

      // Priority: company+CECO > company (no CECO) > global+CECO > global (no CECO)
      const reqCeco = request.id_ceco ?? null;
      let nextLevel = reqCeco
        ? await this.approvalLevelRepo.findOne({ where: { company_id: request.id_company, ceco_id: reqCeco, ...nextLevelWhere }, order: { level_order: 'ASC' }, relations: ['approval_level_actors'] })
        : null;
      if (!nextLevel) {
        nextLevel = await this.approvalLevelRepo.findOne({ where: { company_id: request.id_company, ceco_id: IsNull(), ...nextLevelWhere }, order: { level_order: 'ASC' }, relations: ['approval_level_actors'] });
      }
      if (!nextLevel && reqCeco) {
        nextLevel = await this.approvalLevelRepo.findOne({ where: { company_id: IsNull(), ceco_id: reqCeco, ...nextLevelWhere }, order: { level_order: 'ASC' }, relations: ['approval_level_actors'] });
      }
      if (!nextLevel) {
        nextLevel = await this.approvalLevelRepo.findOne({ where: { company_id: IsNull(), ceco_id: IsNull(), ...nextLevelWhere }, order: { level_order: 'ASC' }, relations: ['approval_level_actors'] });
      }

      if (nextLevel) {
        const nextActors = nextLevel.approval_level_actors ?? [];
        const nextActor = nextActors.find((a) => a.ceco_id === request.id_ceco)
          ?? nextActors.find((a) => a.ceco_id === null)
          ?? nextActors[0]
          ?? null;

        let nextAdminId: string | null = null;
        if (nextActor?.target_id) {
          nextAdminId = nextActor.target_id;
        } else {
          nextAdminId = await this.userChecks.getChainFallbackApprover(id_user, request.id_company);
        }

        if (nextAdminId) {
          await this.requestApprovalRepo.save({
            request_id: id_request,
            approval_level_id: nextLevel.id,
            approval_actor_id: nextActor?.id ?? null,
            approver_user_id: nextAdminId,
            decision: 'PENDING',
            status: 'PENDING',
            amount_snapshot: amountMxn,
            currency_snapshot: request.currency ?? 'MXN',
            escalation_step: 0,
            decided_at: null,
          });
          await this.requestsRepo.update(
            { id: id_request },
            { id_admin: nextAdminId, current_approval_level_id: nextLevel.id, approval_count: 0 },
          );
          const nextAdmin = await this.userRepo.findOne({ where: { id: nextAdminId } });
          void (async () => {
            try {
              if (nextAdmin) {
                await this.notificationsService.notify(
                  nextAdmin.email,
                  `Solicitud de viaje pendiente de tu aprobación — Folio ${folio}`,
                  `La solicitud de viaje (Folio: ${folio}, Título: "${request.title}") ha avanzado al siguiente nivel de aprobación y requiere tu revisión.`,
                  `<p>Hola ${nextAdmin.name},</p>
                   <p>La solicitud de viaje ha avanzado al siguiente nivel de aprobación.</p>
                   <p><strong>Folio:</strong> ${folio}<br><strong>Título:</strong> ${request.title}</p>
                   <p>Por favor, revisa los detalles y procede con tu aprobación.</p>
                   <p>Saludos,</p>
                   <p>Equipo de Monarca</p>`,
                  { companyId: request.id_company, type: NotificationType.REQUEST_STATUS },
                );
              }
              await this.notificationsService.notify(
                request.user.email,
                `Solicitud de viaje en proceso de aprobación — Folio ${folio}`,
                `Tu solicitud de viaje (Folio: ${folio}, Título: "${request.title}") ha avanzado al siguiente nivel de aprobación.`,
                `<p>Hola ${request.user.name},</p>
                 <p>Tu solicitud de viaje ha avanzado al siguiente nivel de aprobación y continúa en revisión.</p>
                 <p><strong>Folio:</strong> ${folio}<br><strong>Título:</strong> ${request.title}</p>
                 <p>Recibirás una notificación cuando se complete el proceso.</p>
                 <p>Saludos,</p>
                 <p>Equipo de Monarca</p>`,
                { companyId: request.id_company, type: NotificationType.REQUEST_STATUS },
              );
            } catch (e) {
              console.error('approve(): notification failed (case B)', e);
            }
          })();
          return await this.requestsRepo.findOne({ where: { id: id_request } });
        }
        // No approver found for next level — fall through to final approval.
      }
    }

    // ── Final approval: all levels complete → Pending Accounting Approval ────────────
    const id_travel_agency = data.id_travel_agency;
    if (!id_travel_agency)
      throw this.clientError(
        'Travel agency is required to complete the final approval.',
        'REQUEST_STATUS_TRAVEL_AGENCY_REQUIRED',
      );
    if (!(await this.travelAgenciesChecks.exists(id_travel_agency!)))
      throw this.clientError(
        'Invalid travel agency id.',
        'REQUEST_STATUS_INVALID_TRAVEL_AGENCY',
      );

    await this.requestsRepo.update(
      { id: id_request },
      { id_travel_agency, approval_count: newApprovalCount },
    );

    // Advance the status first (source of truth), then notify best-effort so a failed
    // notification can't turn a successful approval into an error / block the redirect.
    const updated = await this.requestsService.updateStatus(
      id_request,
      'Pending Accounting Approval',
    );

    void (async () => {
      try {
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
      } catch (e) {
        console.error('approve(): notification failed after final approval', e);
      }
    })();

    return updated;
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

    // Close any pending approval records so they don't linger as PENDING.
    await this.requestApprovalRepo.update(
      { request_id: id_request, status: 'PENDING' },
      { decision: 'DENIED', status: 'CANCELLED', decided_at: new Date() },
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

    // Close any pending approval records so they don't linger as PENDING.
    await this.requestApprovalRepo.update(
      { request_id: id_request, status: 'PENDING' },
      { decision: 'CANCELLED', status: 'CANCELLED', decided_at: new Date() },
    );

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
      relations: ['admin', 'vouchers', 'user', 'SOI'],
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

    // Priority: company+CECO > company (no CECO) > global+CECO > global (no CECO)
    const refCeco = request.id_ceco ?? null;
    let refundLevel = refCeco
      ? await this.approvalLevelRepo.findOne({ where: { company_id: request.id_company, ceco_id: refCeco, ...refundAmountWhere }, order: { level_order: 'ASC' }, relations: ['approval_level_actors'] })
      : null;
    if (!refundLevel) {
      refundLevel = await this.approvalLevelRepo.findOne({ where: { company_id: request.id_company, ceco_id: IsNull(), ...refundAmountWhere }, order: { level_order: 'ASC' }, relations: ['approval_level_actors'] });
    }
    if (!refundLevel && refCeco) {
      refundLevel = await this.approvalLevelRepo.findOne({ where: { company_id: IsNull(), ceco_id: refCeco, ...refundAmountWhere }, order: { level_order: 'ASC' }, relations: ['approval_level_actors'] });
    }
    if (!refundLevel) {
      refundLevel = await this.approvalLevelRepo.findOne({ where: { company_id: IsNull(), ceco_id: IsNull(), ...refundAmountWhere }, order: { level_order: 'ASC' }, relations: ['approval_level_actors'] });
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

    const folio = `${new Date(request.createdAt).getFullYear()}-${String(request.request_num).padStart(3, '0')}`;
    const totalAmountFormatted = totalAmount.toLocaleString('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 2 });
    let notifyApproverEmail = request.admin?.email ?? '';
    let notifyApproverName = request.admin?.name ?? 'Approver';

    if (refundLevel) {
      const newApprover = await this.resolveManagerChainApprover(
        request.id_user,
        request.id_company,
        refundLevel.approval_level_actors ?? [],
      );

      if (!newApprover) {
        // Root of manager chain — no approver exists above the requester; skip to SOI.
        const updated = await this.requestsService.updateStatus(id_request, 'Pending Refund Approval');
        await this.requestLogRepo.save(
          this.requestLogRepo.create({
            id_request,
            id_user,
            report: `Solicitante envió ${pendingVouchers.length} comprobante(s) por un total de ${totalAmountFormatted}. Sin aprobador en cadena gerencial — enviado directamente a SOI.`,
            new_status: 'Pending Refund Approval',
          }),
        );
        if (request.SOI) {
          void (async () => {
            try {
              await this.notificationsService.notify(
                request.SOI.email,
                `Solicitud de viaje pendiente de aprobación de reembolso — Folio ${folio}`,
                `La solicitud (Folio: ${folio}, Título: "${request.title}") fue enviada directamente para aprobación de reembolso.`,
                `<p>Hola ${request.SOI.name},</p>
                 <p>La solicitud fue enviada directamente para aprobación de reembolso (sin aprobador en la cadena gerencial).</p>
                 <p><strong>Folio:</strong> ${folio}<br><strong>Título:</strong> ${request.title}<br><strong>Total comprobantes:</strong> ${totalAmountFormatted}</p>
                 <p>Saludos,</p>
                 <p>Equipo de Monarca</p>`,
                { companyId: request.id_company, type: NotificationType.REQUEST_STATUS },
              );
            } catch (e) {
              console.error('finishedUploadingVouchers(): bypass-to-SOI notification failed', e);
            }
          })();
        }
        return updated;
      }

      if (newApprover.id !== request.id_admin) {
        await this.requestsRepo.update({ id: id_request }, { id_admin: newApprover.id });
      }
      // Track the refund level as the current level and reset approval_count to start the
      // refund-phase counter (travel approvals are already done by now). Open the first record.
      await this.requestsRepo.update(
        { id: id_request },
        { current_approval_level_id: refundLevel.id, approval_count: 0 },
      );
      await this.requestApprovalRepo.save({
        request_id: id_request,
        approval_level_id: refundLevel.id,
        approval_actor_id: null,
        approver_user_id: newApprover.id,
        decision: 'PENDING',
        status: 'PENDING',
        amount_snapshot: totalAmount,
        currency_snapshot: request.currency ?? 'MXN',
        escalation_step: 0,
        decided_at: null,
      });
      notifyApproverEmail = newApprover.email;
      notifyApproverName = newApprover.name;

      // When more than one refund approval is required, give the upcoming approvers a heads-up
      // (mirrors the travel flow). USER levels notify the remaining staged users; MANAGER levels
      // walk the chain from the first approver.
      if (refundLevel.required_approvals > 1) {
        const refundActorsWithTarget = (refundLevel.approval_level_actors ?? []).filter(
          (a) => a.target_id && a.target_id !== newApprover.id,
        );
        const headsUp = async (email: string, name: string) => {
          void this.notificationsService.notify(
            email,
            `Comprobantes pendientes de tu aprobación próximamente — Folio ${folio}`,
            `La comprobación de gastos de la solicitud (Folio: ${folio}, Título: "${request.title}") requerirá tu aprobación en los próximos pasos.`,
            `<p>Hola ${name},</p>
             <p>Una comprobación de gastos requerirá tu aprobación próximamente.</p>
             <p><strong>Folio:</strong> ${folio}<br><strong>Título:</strong> ${request.title}<br><strong>Total comprobantes:</strong> ${totalAmountFormatted}</p>
             <p>Recibirás una nueva notificación cuando llegue tu turno de aprobación.</p>
             <p>Saludos,</p>
             <p>Equipo de Monarca</p>`,
            { companyId: request.id_company, type: NotificationType.REQUEST_STATUS },
          );
        };
        if (refundActorsWithTarget.length > 0) {
          for (const a of refundActorsWithTarget) {
            const fu = await this.userChecks.getUserById(a.target_id!);
            if (fu) await headsUp(fu.email, fu.name);
          }
        } else {
          let currentId: string = newApprover.id;
          for (let i = 1; i < refundLevel.required_approvals; i++) {
            const nextId = await this.userChecks.getChainFallbackApprover(currentId, request.id_company);
            if (!nextId) break;
            const fu = await this.userChecks.getUserById(nextId);
            if (fu) await headsUp(fu.email, fu.name);
            currentId = nextId;
          }
        }
      }
    }

    const advanceFormatted = Number(request.advance_money).toLocaleString('es-MX', {
      style: 'currency',
      currency: request.currency ?? 'MXN',
      minimumFractionDigits: 2,
    });

    // Advance status first (source of truth), then notify best-effort so a failed
    // notification can't turn a successful submission into an error / block the redirect.
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

    void (async () => {
      try {
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
      } catch (e) {
        console.error('finishedUploadingVouchers(): notification failed', e);
      }
    })();

    return updated;
  }

  /**
   * eligibleStagedActors — Filters USER actors down to those whose target_id is an eligible
   * approver, preserving order. Multi-level routing indexes into this list by approval_count.
   */
  private async eligibleStagedActors(
    actors: ApprovalLevelActor[],
    companyId: string,
    requesterId: string,
  ): Promise<ApprovalLevelActor[]> {
    const eligible: ApprovalLevelActor[] = [];
    for (const a of actors) {
      if (a.target_id && (await this.userChecks.isEligibleApprover(a.target_id, companyId, requesterId))) {
        eligible.push(a);
      }
    }
    return eligible;
  }

  /**
   * resolveManagerChainApprover — Walks the manager_id chain from the requester upward.
   * If any actor has target_id, that specific user is returned (override path).
   * Otherwise climbs manager_id links until an is_approver user in the same company is found.
   * An optional ceco_id on the first matching actor restricts the chain to managers in that CECO.
   * Returns null when the chain reaches a root node (manager_id = null) with no qualifying approver.
   */
  private async resolveManagerChainApprover(
    requesterId: string,
    companyId: string,
    actors: ApprovalLevelActor[],
  ): Promise<User | null> {
    // Specific-user actors: return the first staged user who is an eligible approver.
    for (const actor of actors) {
      if (actor.target_id && (await this.userChecks.isEligibleApprover(actor.target_id, companyId, requesterId))) {
        const user = await this.userRepo.findOne({ where: { id: actor.target_id } });
        if (user) return user;
      }
    }

    const cecoFilter = actors.find((a) => a.ceco_id)?.ceco_id ?? null;
    const visited = new Set<string>();
    let cursor = await this.userRepo.findOne({ where: { id: requesterId } });

    while (cursor && cursor.manager_id) {
      if (visited.has(cursor.id)) break;
      visited.add(cursor.id);

      const next = await this.userRepo.findOne({ where: { id: cursor.manager_id } });
      if (!next) break;

      const qualifies =
        next.is_approver &&
        next.status === 'active' &&
        !next.is_company_admin &&
        next.id_company === companyId &&
        (!cecoFilter || next.id_ceco === cecoFilter);

      if (qualifies) return next;
      cursor = next;
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

    // Mark the current PENDING approval as APPROVED. By this point all travel approvals are
    // already APPROVED, so the only PENDING row for this approver is the refund one.
    await this.requestApprovalRepo.update(
      { request_id: id_request, approver_user_id: id_user, status: 'PENDING' },
      { decision: 'APPROVED', status: 'APPROVED', decided_at: new Date() },
    );

    // ── Multi-level refund: route to the next approver if the level needs more approvals ──
    // Applies only when the current level is refund-applicable. approval_count was reset to 0
    // when the refund phase started; it counts refund approvals and doubles as the index into
    // the eligible staged list, so no extra column is needed.
    const refundLevel = request.current_approval_level_id
      ? await this.approvalLevelRepo.findOne({ where: { id: request.current_approval_level_id }, relations: ['approval_level_actors'] })
      : null;
    const isRefundLevel = !!refundLevel && ['refund', 'all'].includes(refundLevel.applies_to);
    const requiredApprovals = isRefundLevel ? (refundLevel!.required_approvals ?? 1) : 1;
    const newRefundCount = (request.approval_count ?? 0) + 1;

    if (isRefundLevel && newRefundCount < requiredApprovals) {
      // Specific-user refund levels route through the staged user list; MANAGER levels walk the chain.
      const refundUserActors = (refundLevel!.approval_level_actors ?? []).filter((a) => a.target_id);
      let nextApproverId: string | null = null;
      let nextRefundActorId: string | null = null;
      if (refundUserActors.length > 0) {
        const eligibleStaged = await this.eligibleStagedActors(refundUserActors, request.id_company, request.id_user);
        const nextStaged = eligibleStaged[newRefundCount];
        nextApproverId = nextStaged?.target_id ?? null;
        nextRefundActorId = nextStaged?.id ?? null;
      } else {
        nextApproverId = await this.userChecks.getChainFallbackApprover(id_user, request.id_company);
      }
      if (nextApproverId) {
        await this.requestApprovalRepo.save({
          request_id: id_request,
          approval_level_id: refundLevel!.id,
          approval_actor_id: nextRefundActorId,
          approver_user_id: nextApproverId,
          decision: 'PENDING',
          status: 'PENDING',
          amount_snapshot: Number(request.advance_money),
          currency_snapshot: request.currency ?? 'MXN',
          escalation_step: 0,
          decided_at: null,
        });
        await this.requestsRepo.update({ id: id_request }, { id_admin: nextApproverId, approval_count: newRefundCount });
        const nextApprover = await this.userRepo.findOne({ where: { id: nextApproverId } });
        if (nextApprover) {
          void (async () => {
            try {
              await this.notificationsService.notify(
                nextApprover.email,
                `Comprobantes pendientes de tu aprobación — Folio ${folio}`,
                `La comprobación de gastos de la solicitud (Folio: ${folio}, Título: "${request.title}") requiere tu aprobación.`,
                `<p>Hola ${nextApprover.name},</p>
                 <p>La comprobación de gastos ha avanzado y requiere ahora tu revisión.</p>
                 <p><strong>Folio:</strong> ${folio}<br><strong>Título:</strong> ${request.title}</p>
                 <p>Por favor, revisa los comprobantes y procede con tu aprobación.</p>
                 <p>Saludos,</p>
                 <p>Equipo de Monarca</p>`,
                { companyId: request.id_company, type: NotificationType.REQUEST_STATUS },
              );
            } catch (e) {
              console.error('finishedApprovingVouchers(): notification failed (next approver)', e);
            }
          })();
        }
        await this.requestLogRepo.save(
          this.requestLogRepo.create({
            id_request,
            id_user,
            report: `Aprobador aprobó comprobantes (${newRefundCount}/${requiredApprovals}). Enrutado al siguiente aprobador.`,
            new_status: 'Pending Vouchers Approval',
          }),
        );
        return await this.requestsRepo.findOne({ where: { id: id_request } });
      }
      // No further approver in the chain — fall through to final refund approval (SOI).
    }

    // Advance status first (source of truth), then notify best-effort.
    const updated = await this.requestsService.updateStatus(id_request, 'Pending Refund Approval');
    await this.requestLogRepo.save(
      this.requestLogRepo.create({
        id_request,
        id_user,
        report: `Aprobador finalizó la revisión de comprobantes.`,
        new_status: 'Pending Refund Approval',
      }),
    );

    void (async () => {
      try {
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
      } catch (e) {
        console.error('finishedApprovingVouchers(): notification failed (final)', e);
      }
    })();

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