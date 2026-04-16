/**
 * FileName: requests.service.ts
 * Description: Service for travel request business logic. Handles request creation,
 *              role-based retrieval, updates, and status changes with auditing.
 * Authors: Original Monarca team
 * Last Modification made:
 * 11/04/2026 [Julio Rodriguez] Standardized request errors to 400/500 policy
 *                              and aligned service header documentation.
 */

import {
  Injectable,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, EntityManager } from 'typeorm';
import { Request as RequestEntity } from './entities/request.entity';
import { CreateRequestDto } from './dto/create-request.dto';
import { UpdateRequestDto } from './dto/update-request.dto';
import { UserChecks } from 'src/users/user.checks.service';
import { DestinationsChecks } from 'src/destinations/destinations.checks';
import { RequestInterface } from 'src/guards/interfaces/request.interface';
import { RequestsDestination } from './entities/requests-destination.entity';
import { RequestLog } from 'src/request-logs/entities/request-log.entity';
import { NotificationsService } from 'src/notifications/notifications.service';

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
    private readonly userChecks: UserChecks,
    private readonly destinationChecks: DestinationsChecks,
    private readonly notificationsService: NotificationsService,
    private readonly dataSource: DataSource,
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
      throw new BadRequestException('Invalid id_origin_city.');
    }

    for (const rd of data.requests_destinations) {
      if (!(await this.destinationChecks.isValid(rd.id_destination)))
        throw new BadRequestException('Invalid id_destination.');
    }

    //ASIGNAR APROVADOR
    const id_department = req.userInfo.id_department;
    const adminId = await this.userChecks.getRandomApproverIdFromSameDepartment(
      id_department,
      userId,
    );
    if (!adminId) {
      throw new InternalServerErrorException({
        message: 'There is no admin available to assign the request.',
        code: 'REQUESTS_ASSIGN_ADMIN_UNAVAILABLE',
      });
    }

    // Assign SOI user
    const SOIId = await this.userChecks.getRandomSOIID();
    if (!SOIId) {
      throw new InternalServerErrorException({
        message: 'There is no SOI available to assign the request.',
        code: 'REQUESTS_ASSIGN_SOI_UNAVAILABLE',
      });
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

    const request = this.requestsRepo.create({
      id_user: userId,
      id_admin: adminId,
      id_SOI: SOIId,
      ...data,
      advance_money: finalAdvanceMoney,
      unconverted_advance_money: finalUnconvertedAdvanceMoney,
      exchange_rate: finalExchangeRate,
      requests_destinations: data.requests_destinations.map((destDto) => ({
        ...destDto,
      })),
    });

    const saved = await this.requestsRepo.save(request);

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

    const admin = await this.userChecks.getUserById(saved.id_admin);

    if (!admin) {
      throw this.serverError(
        `Admin with ID ${saved.id_admin} not found.`,
        'REQUESTS_ASSIGNED_ADMIN_NOT_FOUND',
      );
    }

    // Mandar mail de notificación al admin asignado
    await this.notificationsService.notify(
      admin.email,
      `Nueva solicitud asignada`,
      `Se te ha asignado una nueva solicitud de viaje con ID: ${saved.id}. Por favor, revisa los detalles en el sistema.`,
      `<p>Hola ${admin.name},</p>
<p>Se te ha asignado una nueva solicitud de viaje con ID: <strong>${saved.id}</strong>.</p>
<p>Por favor, revisa los detalles en el sistema.</p>
<p>Saludos,</p>
<p>Equipo de Monarca</p>`
    );


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
      ],
    });
    if (!request)
      throw this.clientError(`Request ${id} not found`, 'REQUESTS_INVALID_ID');

    // VALIDAR QUE PUEDE ACCEDER REQUEST
    const id_travel_agency = req.userInfo.id_travel_agency;

    if (
      userId !== request.id_user &&
      userId !== request.id_admin &&
      userId !== request.id_SOI &&
      !(id_travel_agency && id_travel_agency === request.id_travel_agency) //Testear mas
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
      .leftJoinAndSelect('u.department', 'dept')
      .leftJoinAndSelect('r.admin', 'adm')
      .leftJoinAndSelect('r.SOI', 'soi')
      .leftJoinAndSelect('r.destination', 'dest')
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


  async findBySOI(req: RequestInterface): Promise<RequestEntity[]> {
    const userId = req.sessionInfo.id;
    const list = await this.requestsRepo.find({
      where: { id_SOI: userId },
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

  async findByTA(req: RequestInterface): Promise<RequestEntity[]> {
    const userId = req.sessionInfo.id;
    const travelAgencyId = req.userInfo.id_travel_agency;

    if (!travelAgencyId)
      throw this.clientError(
        'Cannot access this endpoint.',
        'REQUESTS_TRAVEL_AGENCY_REQUIRED',
      );

    const list = await this.requestsRepo.find({
      where: {
        id_travel_agency: travelAgencyId,
        status: 'Pending Reservations',
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
      if (!(await this.destinationChecks.isValid(data.id_origin_city))) {
        throw new BadRequestException('Invalid id_origin_city.');
      }

      for (const rd of data.requests_destinations) {
        if (!(await this.destinationChecks.isValid(rd.id_destination)))
          throw new BadRequestException('Invalid id_destination.');
      }

      //Update informacion general
      let finalAdvanceMoney: number = 0;
      let finalExchangeRate: number | null = null;
      let finalUnconvertedAdvanceMoney: number | null = data.advance_money || null;

      if (data.currency === 'MXN') {
        finalAdvanceMoney = data.advance_money;
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
          finalAdvanceMoney = Math.round(data.advance_money * rate);
        } else {
          console.log(`No exchange rate found in DB for currency ${data.currency} on today's date. Fetching from API...`);
          const fetchedRate = await this.fetchBanxicoRate(data.currency);
          
          if (fetchedRate !== null) {
            finalExchangeRate = fetchedRate;
            finalAdvanceMoney = Math.round(data.advance_money * fetchedRate);
            
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
      entity.currency = data.currency;
      entity.id_origin_city = data.id_origin_city;
      entity.motive = data.motive;
      entity.requirements = data.requirements;
      entity.priority = data.priority;

      //Overhaul de requests_destinations
      const destRepo = manager.getRepository(RequestsDestination);
      entity.requests_destinations = data.requests_destinations.map((d) =>
        destRepo.create({ ...d }),
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
      const admin = await this.userChecks.getUserById(updated.id_admin);
      if (!admin) {
        throw this.serverError(
          `Admin with ID ${updated.id_admin} not found.`,
          'REQUESTS_ASSIGNED_ADMIN_NOT_FOUND',
        );
      }
      await this.notificationsService.notify(
        admin.email,
        `Solicitud actualizada`,
        `La solicitud de viaje con ID: ${updated.id} ha sido actualizada. Por favor, revisa los detalles en el sistema.`,
        `<p>Hola ${admin.name},</p>
<p>La solicitud de viaje con ID: <strong>${updated.id}</strong> ha sido actualizada.</p>
<p>Por favor, revisa los detalles en el sistema.</p>
<p>Saludos,</p>
<p>Equipo de Monarca</p>`
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