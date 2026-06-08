/**
 * FileName: requests.service.ts
 * Description: Service for travel request business logic. Handles request creation,
 *              role-based retrieval, updates, and status changes with auditing.
 * Authors: Original Monarca team, Diego (A01420632)
 * Last Modification made:
 * 03/06/2026 [Julio Rodriguez] Implemented approval level determination logic during request creation, including CECO and company-based rules, and integrated exchange rate fetching for advance money conversion.
 */

import {
  Injectable,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, EntityManager, LessThanOrEqual, MoreThanOrEqual, IsNull, Not, In, Or } from 'typeorm';
import { Request as RequestEntity } from './entities/request.entity';
import { CreateRequestDto } from './dto/create-request.dto';
import { UpdateRequestDto } from './dto/update-request.dto';
import { UserChecks } from 'src/users/user.checks.service';
import { TravelAgenciesChecks } from 'src/travel-agencies/travel-agencies.checks';
import { DestinationsChecks } from 'src/destinations/destinations.checks';
import { RequestInterface } from 'src/guards/interfaces/request.interface';
import { RequestsDestination } from './entities/requests-destination.entity';
import { RequestLog } from 'src/request-logs/entities/request-log.entity';
import { NotificationsService } from 'src/notifications/notifications.service';
import { NotificationType } from 'src/notifications/notification-types';
import { UserLogsService } from 'src/user-logs/user-logs.service';
import { ApprovalLevel } from 'src/approval-engine/entities/approval-level.entity';
import { RequestApproval } from 'src/approval-engine/entities/request-approval.entity';

const BANXICO_CURRENCY_MAPPING: Record<string, string> = {
  USD: 'SF43718',
  EUR: 'SF46410',
  JPY: 'SF46406',
  GBP: 'SF46407',
  CAD: 'SF60632',
  CHF: 'SF46405',
  CNY: 'SF290383',
  BRL: 'SF290312',
  ARS: 'SF290311',
  CLP: 'SF290351',
  COP: 'SF290382',
};

@Injectable()
export class RequestsService {
  constructor(
    @InjectRepository(RequestEntity)
    private readonly requestsRepo: Repository<RequestEntity>,
    @InjectRepository(ApprovalLevel)
    private readonly approvalLevelRepo: Repository<ApprovalLevel>,
    @InjectRepository(RequestApproval)
    private readonly requestApprovalRepo: Repository<RequestApproval>,
    private readonly userChecks: UserChecks,
    private readonly destinationChecks: DestinationsChecks,
    private readonly notificationsService: NotificationsService,
    private readonly dataSource: DataSource,
    private readonly userLogsService: UserLogsService,
    private readonly travelAgenciesChecks: TravelAgenciesChecks,
  ) { }

  private async fetchBanxicoRate(currency: string): Promise<number | null> {
    const banxicoId = BANXICO_CURRENCY_MAPPING[currency];
    if (!banxicoId) return null;

    const bmxToken = process.env['BMX-TOKEN'];
    if (!bmxToken) {
      console.warn('BMX-TOKEN is not set in environment.');
      return null;
    }

    try {
      const url = `https://www.banxico.org.mx/SieAPIRest/service/v1/series/${banxicoId}/datos/oportuno`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Bmx-Token': bmxToken,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        console.error(`Banxico API error: ${response.statusText}`);
        return null;
      }

      const rawData = await response.json();
      const series = rawData?.bmx?.series?.[0];
      const data = series?.datos?.[0];
      
      if (data && data.dato) {
        const rate = parseFloat(data.dato);
        return isNaN(rate) ? null : rate;
      }
      return null;
    } catch (error) {
      console.error('Failed to fetch from Banxico API:', error);
      return null;
    }
  }

  private clientError(message: string, code: string) {
    return new BadRequestException({ message, code });
  }

  private serverError(message: string, code: string) {
    return new InternalServerErrorException({ message, code });
  }

  private async getCityName(id: string): Promise<string> {
    return await this.destinationChecks.getCityNameById(id);
  }

  private async logRequestAction(
    manager: EntityManager,
    id_request: string,
    id_user: string,
    action: 'create' | 'update' | 'status_change',
    new_status: string,
    extraData?: Record<string, any>,
  ) {
    let report: string;

    switch (action) {
      case 'create':
        report = `Solicitud creada con origen en la ciudad ${extraData?.originCity} y ${extraData?.numDestinations} destino(s).`;
        break;
      case 'update':
        report = `Solicitud actualizada. Se modificaron campos como motivo, ciudad de origen o destinos.`;
        break;
      case 'status_change':
        report = `El estado cambió de '${extraData?.fromStatus}' a '${new_status}'.`;
        break;
      default:
        report = 'Acción realizada en la solicitud.';
    }

    await manager.save(RequestLog, {
      id_request,
      id_user,
      report,
      new_status,
    });
  }

  async create(req: RequestInterface, data: CreateRequestDto) {
    const userId = req.sessionInfo.id;
    //VALIDAR VALIDEZ DE CIUDADES
    if (!(await this.destinationChecks.isValid(data.id_origin_city))) {
      throw this.clientError(
        'Invalid id_origin_city.',
        'REQUESTS_INVALID_ORIGIN_CITY',
      );
    }

    for (const rd of data.requests_destinations) {
      if (!(await this.destinationChecks.isValid(rd.id_destination)))
        throw this.clientError(
          'Invalid id_destination.',
          'REQUESTS_INVALID_DESTINATION',
        );
    }
    
    const id_ceco = req.userInfo.id_ceco;
    if (!id_ceco) {
      throw this.clientError(
        'The requester is not linked to any cost center.',
        'REQUESTS_REQUESTER_CECO_REQUIRED',
      );
    }

    let id_company = req.userInfo.id_company;
    if (!id_company) {
      const rows = await this.dataSource.query(
        `SELECT id_company FROM cost_centers WHERE id = $1 LIMIT 1`,
        [id_ceco],
      );
      id_company = rows?.[0]?.id_company;
    }

    if (!id_company) {
      throw this.clientError(
        'The requester is not linked to any company.',
        'REQUESTS_REQUESTER_COMPANY_REQUIRED',
      );
    }

    const SOIId = await this.userChecks.getRandomSOIID(id_company);
    if (!SOIId) {
      throw this.serverError(
        'There is no SOI available to assign the request.',
        'REQUESTS_ASSIGN_SOI_UNAVAILABLE',
      );
    }

    let finalAdvanceMoney: number = 0;
    let finalExchangeRate: number | null = null;
    let finalUnconvertedAdvanceMoney: number | null = data.advance_money || null;

    if (data.currency === 'MXN') {
      finalAdvanceMoney = data.advance_money;
    } else if (data.currency) {
      const now = new Date();
      const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      const rates = await this.dataSource.query(
        `SELECT exchange_rate FROM exchange_rates WHERE currency = $1 AND update_date = $2`,
        [data.currency, todayStr],
      );

      if (rates && rates.length > 0) {
        const rate = Number(rates[0].exchange_rate);
        finalExchangeRate = rate;
        finalAdvanceMoney = Math.round(data.advance_money * rate);
      } else {
        console.log(`No exchange rate found in DB for currency ${data.currency} on today's date. Fetching from API...`);
        const fetchedRate = await this.fetchBanxicoRate(data.currency);
        
        if (fetchedRate !== null) {
          finalExchangeRate = fetchedRate;
          finalAdvanceMoney = Math.round(data.advance_money * fetchedRate);
          
          await this.dataSource.query(
            `INSERT INTO exchange_rates (currency, exchange_rate, update_date) VALUES ($1, $2, $3)`,
            [data.currency, fetchedRate, todayStr]
          );
        } else {
          console.log(`Could not fetch exchange rate for currency ${data.currency}. Proceeding with default (0).`);
        }
      }
    }

    const amountWhere = {
      is_active: true,
      applies_to: In(['travel', 'all']),
      min_amount_mon: Or(IsNull(), LessThanOrEqual(finalAdvanceMoney)),
      max_amount_mon: Or(IsNull(), MoreThanOrEqual(finalAdvanceMoney)),
    };
    const levelOrder = { level_order: 'ASC' as const };
    const levelRelations = ['approval_level_actors'];

    // Priority: company + CECO > company (no CECO) > global+CECO > global (no CECO)
    let level = id_ceco
      ? await this.approvalLevelRepo.findOne({ where: { company_id: id_company, ceco_id: id_ceco, ...amountWhere }, order: levelOrder, relations: levelRelations })
      : null;
    if (!level) {
      level = await this.approvalLevelRepo.findOne({ where: { company_id: id_company, ceco_id: IsNull(), ...amountWhere }, order: levelOrder, relations: levelRelations });
    }
    if (!level && id_ceco) {
      level = await this.approvalLevelRepo.findOne({ where: { company_id: IsNull(), ceco_id: id_ceco, ...amountWhere }, order: levelOrder, relations: levelRelations });
    }
    if (!level) {
      level = await this.approvalLevelRepo.findOne({ where: { company_id: IsNull(), ceco_id: IsNull(), ...amountWhere }, order: levelOrder, relations: levelRelations });
    }
    if (!level) {
      throw this.clientError(
        'No approval level is configured for this amount in your company.',
        'REQUESTS_NO_APPROVAL_LEVEL',
      );
    }

    const actors = level.approval_level_actors ?? [];
    const userActors = actors.filter((a) => a.target_id);
    let adminId: string | null = null;
    let selectedActor: (typeof actors)[number] | null = null;
    if (userActors.length > 0) {
      // Specific-user level: assign the first staged user who is an eligible approver
      // (active, is_approver, not a company admin, same company, not the requester).
      for (const a of userActors) {
        if (a.target_id && (await this.userChecks.isEligibleApprover(a.target_id, id_company, userId))) {
          adminId = a.target_id;
          selectedActor = a;
          break;
        }
      }
      // If no staged user is eligible, fall through to the manager chain below.
    }
    if (!adminId) {
      adminId = await this.userChecks.getApproverIdFromManagerChain(userId, level.level_order, id_company);
      if (!adminId) adminId = await this.userChecks.getChainFallbackApprover(userId, id_company);
    }
    // When no approver is found in the chain (requester is at the top of the hierarchy),
    // skip approval and go directly to Pending Accounting Approval with SOI.
    const bypassToSoi = adminId === null;
    let bypassAgencyId: string | null = null;
    if (bypassToSoi) {
      adminId = SOIId;
      // No approver was there to pick a travel agency, so auto-assign one so the
      // downstream SOI → reservations flow can proceed.
      bypassAgencyId = await this.travelAgenciesChecks.getDefaultAgencyId();
    }
    if (!adminId) {
      throw this.serverError(
        'There is no approver available to assign the request.',
        'REQUESTS_ASSIGN_ADMIN_UNAVAILABLE',
      );
    }

    // Increment the per-company counter and insert the request in one transaction so a
    // failed insert rolls back the counter (no gaps in the per-company request numbering).
    const savedRaw = await this.dataSource.transaction(async (manager) => {
      const counterResult = await manager.query(
        `INSERT INTO company_request_counters (company_id, counter)
         VALUES ($1, 1)
         ON CONFLICT (company_id) DO UPDATE SET counter = company_request_counters.counter + 1
         RETURNING counter`,
        [id_company],
      );
      const requestNum: number = counterResult[0].counter;

      const request = manager.create(RequestEntity, {
        ...data,
        id_user: userId,
        id_admin: adminId,
        id_SOI: SOIId,
        id_company,
        id_ceco,
        request_num: requestNum,
        current_approval_level_id: level.id,
        advance_money: finalAdvanceMoney,
        unconverted_advance_money: finalUnconvertedAdvanceMoney,
        exchange_rate: finalExchangeRate,
        ...(bypassToSoi && { status: 'Pending Accounting Approval' }),
        ...(bypassAgencyId && { id_travel_agency: bypassAgencyId }),
        requests_destinations: data.requests_destinations.map((destDto) => ({
          ...destDto,
          provider_support_status: 'pending_provider',
          provider_support_reason: null,
          provider_support_checked_at: null,
        })),
      });

      return await manager.save(request);
    });
    const saved = await this.requestsRepo.findOneOrFail({ where: { id: savedRaw.id }, relations: ['requests_destinations'] });

    if (!bypassToSoi) {
      await this.requestApprovalRepo.save({
        request_id: saved.id,
        approval_level_id: level.id,
        approval_actor_id: selectedActor?.id ?? null,
        approver_user_id: adminId,
        decision: 'PENDING',
        status: 'PENDING',
        amount_snapshot: finalAdvanceMoney,
        currency_snapshot: data.currency ?? 'MXN',
        escalation_step: 0,
        decided_at: null,
      });
    }

    // Log creación de un request
    const originCityName = await this.getCityName(saved.id_origin_city);
    await this.logRequestAction(
      this.dataSource.createEntityManager(),
      saved.id,
      saved.id_user,
      'create',
      saved.status,
      {
        originCity: originCityName,
        numDestinations: saved.requests_destinations.length,
      },
    );

    const savedFolio = `${new Date(saved.createdAt).getFullYear()}-${String(saved.request_num).padStart(3, '0')}`;

    void this.userLogsService.create({
      id_user: saved.id_user,
      ip: req.ip,
      report: `REQUEST_CREATED§${savedFolio}§${saved.title}§${saved.id}`,
    });

    if (bypassToSoi) {
      // No approver in chain — notify SOI directly.
      const soi = await this.userChecks.getUserById(SOIId);
      if (soi) {
        await this.notificationsService.notify(
          soi.email,
          `Solicitud de viaje pendiente de aprobación de presupuesto — Folio ${savedFolio}`,
          `La solicitud (Folio: ${savedFolio}, Título: "${saved.title}") fue enviada directamente para aprobación de presupuesto (sin aprobador en la cadena).`,
          `<p>Hola ${soi.name},</p>
           <p>La solicitud de viaje fue enviada directamente para tu aprobación de presupuesto porque el solicitante no tiene aprobador disponible en su cadena jerárquica.</p>
           <p><strong>Folio:</strong> ${savedFolio}<br><strong>Título:</strong> ${saved.title}</p>
           <p>Por favor, revisa los detalles y procede con la aprobación.</p>
           <p>Saludos,</p>
           <p>Equipo de Monarca</p>`,
          { companyId: saved.id_company, type: NotificationType.REQUEST_CREATED },
        );
      }
      return saved;
    }

    const approver = await this.userChecks.getUserById(saved.id_admin);

    if (!approver) {
      throw this.serverError(
        `Approver with ID ${saved.id_admin} not found.`,
        'REQUESTS_ASSIGNED_ADMIN_NOT_FOUND',
      );
    }

    // Notify the first assigned approver
    await this.notificationsService.notify(
      approver.email,
      `Nueva solicitud asignada — Folio ${savedFolio}`,
      `Se te ha asignado una nueva solicitud de viaje (Folio: ${savedFolio}, Título: "${saved.title}"). Por favor, revisa los detalles en el sistema.`,
      `<p>Hola ${approver.name},</p>
       <p>Se te ha asignado una nueva solicitud de viaje.</p>
       <p><strong>Folio:</strong> ${savedFolio}<br><strong>Título:</strong> ${saved.title}</p>
       <p>Por favor, revisa los detalles en el sistema.</p>
       <p>Saludos,</p>
       <p>Equipo de Monarca</p>`,
      { companyId: saved.id_company, type: NotificationType.REQUEST_CREATED },
    );

    // When multiple approvals are required, notify all upcoming approvers upfront.
    if (level.required_approvals > 1) {
      const actorsWithTarget = actors.filter((a) => a.target_id && a.target_id !== adminId);
      if (actorsWithTarget.length > 0) {
        for (const a of actorsWithTarget) {
          const fu = await this.userChecks.getUserById(a.target_id!);
          if (!fu) continue;
          void this.notificationsService.notify(
            fu.email,
            `Solicitud de viaje pendiente de tu aprobación próximamente — Folio ${savedFolio}`,
            `La solicitud (Folio: ${savedFolio}, Título: "${saved.title}") ha sido creada y requerirá tu aprobación en los próximos pasos.`,
            `<p>Hola ${fu.name},</p>
             <p>Se ha creado una solicitud de viaje que requerirá tu aprobación próximamente.</p>
             <p><strong>Folio:</strong> ${savedFolio}<br><strong>Título:</strong> ${saved.title}</p>
             <p>Recibirás una nueva notificación cuando llegue tu turno de aprobación.</p>
             <p>Saludos,</p>
             <p>Equipo de Monarca</p>`,
            { companyId: saved.id_company, type: NotificationType.REQUEST_CREATED },
          );
        }
      } else {
      let currentId: string = adminId;
      for (let i = 1; i < level.required_approvals; i++) {
        const nextId = await this.userChecks.getChainFallbackApprover(currentId, id_company);
        if (!nextId) break;
        const fu = await this.userChecks.getUserById(nextId);
        if (fu) {
          void this.notificationsService.notify(
            fu.email,
            `Solicitud de viaje pendiente de tu aprobación próximamente — Folio ${savedFolio}`,
            `La solicitud (Folio: ${savedFolio}, Título: "${saved.title}") ha sido creada y requerirá tu aprobación en los próximos pasos.`,
            `<p>Hola ${fu.name},</p>
             <p>Se ha creado una solicitud de viaje que requerirá tu aprobación próximamente.</p>
             <p><strong>Folio:</strong> ${savedFolio}<br><strong>Título:</strong> ${saved.title}</p>
             <p>Recibirás una nueva notificación cuando llegue tu turno de aprobación.</p>
             <p>Saludos,</p>
             <p>Equipo de Monarca</p>`,
            { companyId: saved.id_company, type: NotificationType.REQUEST_CREATED },
          );
        }
        currentId = nextId;
      }
      }
    }

    return saved;
  }

  async findAll(): Promise<RequestEntity[]> {
    return this.requestsRepo.find({
      relations: [
        'requests_destinations',
        'requests_destinations.destination',
        'revisions',
        'user',
        'admin',
        'SOI',
        'destination',
        'travel_agency',
        'travel_agency.users',
        'ceco',
      ],
    });
  }

  async findOne(req: RequestInterface, id: string): Promise<RequestEntity> {
    const userId = req.sessionInfo.id;

    const request = await this.requestsRepo.findOne({
      where: { id },
      relations: [
        'requests_destinations',
        'requests_destinations.destination',
        'revisions',
        'user',
        'admin',
        'SOI',
        'destination',
        'vouchers',
        'requests_destinations.reservations',
        'ceco',
        'company',
      ],
    });

    if (!request)
      throw this.clientError(`Request ${id} not found`, 'REQUESTS_INVALID_ID');

    // VALIDAR QUE PUEDE ACCEDER REQUEST
    const id_travel_agency = req.userInfo.id_travel_agency;
    const isTravelAgent = req.userInfo?.is_travelAgent === true;
    const isAdmin =
      req.userInfo?.is_system_admin === true ||
      (req.userInfo?.is_company_admin === true &&
        req.userInfo.id_company === request.id_company);

    // Allow access when any of the following is true:
    // - system admin or company admin of the same company
    // - request owner, assigned approver, or SOI
    // - user belongs to the same travel agency as the request
    // - user is a travel agent (can access any request regardless of status)
    if (
      !isAdmin &&
      userId !== request.id_user &&
      userId !== request.id_admin &&
      userId !== request.id_SOI &&
      !(id_travel_agency && id_travel_agency === request.id_travel_agency) &&
      !isTravelAgent
    )
      throw this.clientError('Cannot access this request.', 'REQUESTS_ACCESS_DENIED');

    return request;
  }

  async findByUser(req: RequestInterface): Promise<RequestEntity[]> {
    const userId = req.sessionInfo.id;
    const list = await this.requestsRepo.find({
      where: { id_user: userId },
      relations: [
        'requests_destinations',
        'requests_destinations.destination',
        'revisions',
        'user',
        'admin',
        'SOI',
        'destination',
      ],
    });
    return list;
  }

  async findByAdmin(req: RequestInterface): Promise<RequestEntity[]> {
    const userId = req.sessionInfo.id;

    return this.requestsRepo
      .createQueryBuilder('r')
      .leftJoinAndSelect('r.requests_destinations', 'rd')
      .leftJoinAndSelect('rd.destination', 'd')
      .leftJoinAndSelect('r.revisions', 'rev')
      .leftJoinAndSelect('r.user', 'u')
      .leftJoinAndSelect('r.admin', 'adm')
      .leftJoinAndSelect('r.SOI', 'soi')
      .leftJoinAndSelect('r.destination', 'dest')
      .leftJoinAndSelect('r.ceco', 'ceco')
      .where('r.id_admin = :userId', { userId })
      .andWhere('r.status = :status', { status: 'Pending Review' })
      .orderBy(
        `CASE r.priority
         WHEN 'alta' THEN 1
         WHEN 'media' THEN 2
         WHEN 'baja' THEN 3
       END`,
        'ASC'
      )
      .getMany();
  }

  async findApprovedHistory(req: RequestInterface): Promise<RequestEntity[]> {
    const userId = req.sessionInfo.id;

    return this.requestsRepo.find({
      where: {
        id_admin: userId,
        status: Not(In(['Pending Review', 'Denied', 'Cancelled'])),
      },
      relations: [
        'requests_destinations',
        'requests_destinations.destination',
        'revisions',
        'user',
        'admin',
        'SOI',
        'destination',
        'ceco',
      ],
    });
  }


  async findBySOI(req: RequestInterface): Promise<RequestEntity[]> {
    const userId = req.sessionInfo.id;
    const list = await this.requestsRepo.find({
      where: {
        id_SOI: userId,
        status: 'Pending Accounting Approval',
      },
      relations: [
        'requests_destinations',
        'requests_destinations.destination',
        'revisions',
        'user',
        'admin',
        'SOI',
        'destination',
      ],
    });
    return list;
  }

  /**
   * findVouchersToApprove - Lists requests in 'Pending Vouchers Approval' assigned to the current approver.
   * Input: req (RequestInterface) - session info used to identify the approver (id_admin).
   * Output: Promise<RequestEntity[]> - requests awaiting voucher review by this approver.
   */
  async findVouchersToApprove(req: RequestInterface): Promise<RequestEntity[]> {
    const userId = req.sessionInfo.id;
    return this.requestsRepo.find({
      where: {
        id_admin: userId,
        status: 'Pending Vouchers Approval',
      },
      relations: [
        'requests_destinations',
        'requests_destinations.destination',
        'revisions',
        'user',
        'admin',
        'SOI',
        'destination',
      ],
    });
  }

  // Para jalar todos los requests en estatus de Pending Refund Approval asignados a un SOI
  async findPendingRefundApproval(req: RequestInterface): Promise<RequestEntity[]> {
    const userId = req.sessionInfo.id;
    const list = await this.requestsRepo.find({
      where: {
        status: 'Pending Refund Approval',
        id_SOI: userId
      },
      relations: [
        'requests_destinations',
        'requests_destinations.destination',
        'revisions',
        'user',
        'admin',
        'SOI',
        'destination',
      ],
    });
    return list;
  }

  async findTAHistory(req: RequestInterface): Promise<RequestEntity[]> {
    const travelAgencyId = req.userInfo.id_travel_agency;
    const excludedStatuses = ['Pending Review', 'Denied', 'Cancelled', 'Changes Needed', 'Pending Reservations'];

    return this.requestsRepo.find({
      where: travelAgencyId
        ? { id_travel_agency: travelAgencyId, status: Not(In(excludedStatuses)) }
        : { status: Not(In(excludedStatuses)) },
      relations: [
        'requests_destinations',
        'requests_destinations.destination',
        'revisions',
        'user',
        'admin',
        'SOI',
        'destination',
        'travel_agency',
        'travel_agency.users',
      ],
    });
  }

  async findByTA(req: RequestInterface): Promise<RequestEntity[]> {
    const userId = req.sessionInfo.id;
    const travelAgencyId = req.userInfo.id_travel_agency;

    // Build query based on whether user has a travel agency assigned
    const whereClause = travelAgencyId
      ? { id_travel_agency: travelAgencyId, status: 'Pending Reservations' }
      : { status: 'Pending Reservations' };

    const list = await this.requestsRepo.find({
      where: whereClause,
      relations: [
        'requests_destinations',
        'requests_destinations.destination',
        'revisions',
        'user',
        'admin',
        'SOI',
        'destination',
      ],
    });
    return list;
  }

  async findReservedHistory(req: RequestInterface): Promise<RequestEntity[]> {
    const travelAgencyId = req.userInfo.id_travel_agency;
    const isTravelAgent = req.userInfo?.is_travelAgent === true;

    const statusFilter = In([
      'In Progress',
      'Pending Vouchers Approval',
      'Pending Refund Approval',
      'Completed',
    ]);

    const whereClause = travelAgencyId
      ? { id_travel_agency: travelAgencyId, status: statusFilter }
      : isTravelAgent
      ? { status: statusFilter }
      : null;

    if (!whereClause) {
      return [];
    }

    return this.requestsRepo.find({
      where: whereClause,
      relations: [
        'requests_destinations',
        'requests_destinations.destination',
        'revisions',
        'user',
        'admin',
        'SOI',
        'destination',
      ],
    });
  }

  async updateRequest(
    req: RequestInterface,
    id: string,
    data: UpdateRequestDto,
  ) {
    //Crea un transaction, entonces en caso de un error hay rollback automatico
    return await this.dataSource.transaction(async (manager) => {
      const repo = manager.withRepository(this.requestsRepo);

      const entity = await repo.findOne({
        where: { id },
        relations: ['requests_destinations'],
      });
      if (!entity)
        throw this.clientError(`Request ${id} not found`, 'REQUESTS_INVALID_ID');

      if (req.sessionInfo.id !== entity.id_user)
        throw this.clientError(
          'Unable to edit this request.',
          'REQUESTS_UPDATE_NOT_ALLOWED',
        );

      //Un request solo puede ser editado si esta en estos estados
      if (
        entity.status !== 'Pending Review' &&
        entity.status !== 'Changes Needed'
      )
        throw this.clientError(
          'Unable to edit this request beacuse of its current status.',
          'REQUESTS_UPDATE_INVALID_STATE',
        );

      //VALIDAR VALIDEZ DE CIUDADES
      if (!(await this.destinationChecks.isValid(data.id_origin_city!))) {
        throw this.clientError(
          'Invalid id_origin_city.',
          'REQUESTS_INVALID_ORIGIN_CITY',
        );
      }

      for (const rd of data.requests_destinations!) {
        if (!(await this.destinationChecks.isValid(rd.id_destination)))
          throw this.clientError(
            'Invalid id_destination.',
            'REQUESTS_INVALID_DESTINATION',
          );
      }

      //Update informacion general
      let finalAdvanceMoney: number = 0;
      let finalExchangeRate: number | null = null;
      let finalUnconvertedAdvanceMoney: number | null = data.advance_money ?? null;

      if (data.currency === 'MXN') {
        finalAdvanceMoney = data.advance_money!;
      } else if (data.currency) {
        const now = new Date();
        const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        const rates = await manager.query(
          `SELECT exchange_rate FROM exchange_rates WHERE currency = $1 AND update_date = $2`,
          [data.currency, todayStr],
        );

        if (rates && rates.length > 0) {
          const rate = Number(rates[0].exchange_rate);
          finalExchangeRate = rate;
          finalAdvanceMoney = Math.round(data.advance_money! * rate);
        } else {
          console.log(`No exchange rate found in DB for currency ${data.currency} on today's date. Fetching from API...`);
          const fetchedRate = await this.fetchBanxicoRate(data.currency);

          if (fetchedRate !== null) {
            finalExchangeRate = fetchedRate;
            finalAdvanceMoney = Math.round(data.advance_money! * fetchedRate);

            await manager.query(
              `INSERT INTO exchange_rates (currency, exchange_rate, update_date) VALUES ($1, $2, $3)`,
              [data.currency, fetchedRate, todayStr]
            );
          } else {
            console.log(`Could not fetch exchange rate for currency ${data.currency}. Proceeding with default (0).`);
          }
        }
      }

      entity.unconverted_advance_money = finalUnconvertedAdvanceMoney;
      entity.exchange_rate = finalExchangeRate;
      entity.advance_money = finalAdvanceMoney;
      entity.currency = data.currency ?? null;
      entity.id_origin_city = data.id_origin_city!;
      entity.motive = data.motive!;
      entity.requirements = data.requirements ?? null;
      entity.priority = data.priority!;

      //Overhaul de requests_destinations
      const destRepo = manager.getRepository(RequestsDestination);
      entity.requests_destinations = data.requests_destinations!.map((d) =>
        destRepo.create({
          ...d,
          provider_support_status: 'pending_provider',
          provider_support_reason: null,
          provider_support_checked_at: null,
        }),
      );

      //Update status
      entity.status = 'Pending Review';

      const updated = await repo.save(entity);

      // Log de actualización
      await this.logRequestAction(
        manager,
        updated.id,
        updated.id_user,
        'update',
        updated.status,
      );

      // Notificar al admin asignado
      const approver = await this.userChecks.getUserById(updated.id_admin);
      if (!approver) {
        throw this.serverError(
          `Approver with ID ${updated.id_admin} not found.`,
          'REQUESTS_ASSIGNED_ADMIN_NOT_FOUND',
        );
      }
      const updatedFolio = `${new Date(updated.createdAt).getFullYear()}-${String(updated.request_num).padStart(3, '0')}`;
      await this.notificationsService.notify(
        approver.email,
        `Solicitud actualizada — Folio ${updatedFolio}`,
        `La solicitud de viaje (Folio: ${updatedFolio}, Título: "${updated.title}") ha sido actualizada. Por favor, revisa los detalles en el sistema.`,
        `<p>Hola ${approver.name},</p>
         <p>La solicitud de viaje ha sido actualizada.</p>
         <p><strong>Folio:</strong> ${updatedFolio}<br><strong>Título:</strong> ${updated.title}</p>
         <p>Por favor, revisa los detalles en el sistema.</p>
         <p>Saludos,</p>
         <p>Equipo de Monarca</p>`
        ,
        { companyId: updated.id_company, type: NotificationType.REQUEST_STATUS },
      );

      return updated;
    });
  }

  async getRequestById(id: string): Promise<RequestEntity> {
    const request = await this.requestsRepo.findOne({
      where: { id },
    });
    if (!request) {
      throw this.clientError(
        `Request with ID ${id} not found.`,
        'REQUESTS_INVALID_ID',
      );
    }
    return request;
  }

  async updateStatus(id: string, newStatus: string): Promise<RequestEntity> {
    const request = await this.requestsRepo.findOne({ where: { id } });

    if (!request) {
      throw this.clientError('Request not found', 'REQUESTS_INVALID_ID');
    }
    const previousStatus = request.status;
    request.status = newStatus;

    const updated = await this.requestsRepo.save(request);

    // Log de cambio de estado
    await this.logRequestAction(
      this.dataSource.createEntityManager(),
      updated.id,
      updated.id_user,
      'status_change',
      newStatus,
      { fromStatus: previousStatus },
    );

    return updated;
  }
}