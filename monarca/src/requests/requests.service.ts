/**
 * requests.service.ts
 * Description: Core service for managing travel requests. Provides CRUD operations including
 * creating requests with auto-assigned approver/SOI, querying requests by user/admin/SOI/travel
 * agency, updating request details within allowed statuses, and updating request status with
 * logging and email notifications.
 * Authors: Original Monarca team
 * Last Modification made:
 * 25/02/2026 [Juan Pablo Narchi Capote] Added detailed comments and documentation for clarity and maintainability.
 */

import {
  Injectable,
  NotFoundException,
  HttpException,
  HttpStatus,
  BadRequestException,
  UnauthorizedException,
  ConflictException,
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

@Injectable()
export class RequestsService {
  constructor(
    @InjectRepository(RequestEntity)
    private readonly requestsRepo: Repository<RequestEntity>,
    private readonly userChecks: UserChecks,
    private readonly destinationChecks: DestinationsChecks,
    private readonly notificationsService: NotificationsService,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * getCityName, retrieves the city name for a given destination ID.
   * Input: id (string) - the UUID of the destination.
   * Output: string - the city name.
   */
  private async getCityName(id: string): Promise<string> {
    return await this.destinationChecks.getCityNameById(id);
  }

  /**
   * logRequestAction, creates a log entry for a request action (create, update, or status change)
   * within a transactional entity manager.
   * Input: manager (EntityManager) - the transactional entity manager,
   *        id_request (string) - UUID of the request,
   *        id_user (string) - UUID of the user performing the action,
   *        action ('create' | 'update' | 'status_change') - the type of action,
   *        new_status (string) - the new status of the request,
   *        extraData (Record<string, any>) - optional additional data (originCity, numDestinations, fromStatus).
   * Output: void - saves the log entry to the database.
   */
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

  /**
   * create, creates a new travel request. Validates destination cities, auto-assigns an
   * approver from the same department, auto-assigns an SOI, saves the request with its
   * destinations, logs the creation, and sends an email notification to the assigned admin.
   * Input: req (RequestInterface) - the authenticated request with session/user info,
   *        data (CreateRequestDto) - the request payload with origin city, destinations, motive, etc.
   * Output: the saved Request entity with all its destinations.
   */
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
      throw new HttpException(
        'There is no admin available to assign the request.',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    //ASIGNAR SOI
    const SOIId = await this.userChecks.getRandomSOIID();
    if (!SOIId) {
      throw new HttpException(
        'There is no SOI available to assign the request.',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    const request = this.requestsRepo.create({
      id_user: userId,
      id_admin: adminId,
      id_SOI: SOIId,
      ...data,
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
      throw new NotFoundException(`Admin with ID ${saved.id_admin} not found.`);
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

  /**
   * findAll, retrieves all travel requests with their related entities (destinations,
   * revisions, users, admin, SOI, travel agency).
   * Input: none.
   * Output: array of all Request entities with full relations loaded.
   */
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

  /**
   * findOne, retrieves a single travel request by ID. Validates that the authenticated
   * user is the request owner, assigned admin, assigned SOI, or belongs to the assigned
   * travel agency before returning the request.
   * Input: req (RequestInterface) - the authenticated request with session/user info,
   *        id (string) - UUID of the request.
   * Output: the Request entity if found and the user has access.
   */
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
    if (!request) throw new NotFoundException(`Request ${id} not found`);

    // VALIDAR QUE PUEDE ACCEDER REQUEST
    const id_travel_agency = req.userInfo.id_travel_agency;

    if (
      userId !== request.id_user &&
      userId !== request.id_admin &&
      userId !== request.id_SOI &&
      !(id_travel_agency && id_travel_agency === request.id_travel_agency) //Testear mas
    )
      throw new UnauthorizedException('Cannot access this request.');

    return request;
  }

  /**
   * findByUser, retrieves all travel requests owned by the authenticated user.
   * Input: req (RequestInterface) - the authenticated request with session info.
   * Output: array of Request entities belonging to the user, with full relations loaded.
   */
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

/**
   * findByAdmin, retrieves all requests assigned to the authenticated admin that are
   * in "Pending Review" status. Results are ordered by priority (alta > media > baja).
   * Input: req (RequestInterface) - the authenticated request with session info.
   * Output: array of Request entities pending admin review, sorted by priority.
   */
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


  /**
   * findBySOI, retrieves all requests assigned to the authenticated SOI user.
   * Input: req (RequestInterface) - the authenticated request with session info.
   * Output: array of Request entities assigned to the SOI, with full relations loaded.
   */
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

  /**
   * findPendingRefundApproval, retrieves all requests in "Pending Refund Approval" status
   * assigned to the authenticated SOI user.
   * Input: req (RequestInterface) - the authenticated request with session info.
   * Output: array of Request entities pending refund approval for the SOI.
   */
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

  /**
   * findByTA, retrieves all requests assigned to the authenticated travel agency user
   * that are in "Pending Reservations" status.
   * Input: req (RequestInterface) - the authenticated request with session/user info.
   * Output: array of Request entities pending reservations for the travel agency.
   */
  async findByTA(req: RequestInterface): Promise<RequestEntity[]> {
    const userId = req.sessionInfo.id;
    const travelAgencyId = req.userInfo.id_travel_agency;

    if (!travelAgencyId)
      throw new UnauthorizedException('Cannot access this endpoint.');

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

  /**
   * updateRequest, updates an existing travel request within a database transaction.
   * Validates that the user owns the request, that the status allows editing ("Pending Review"
   * or "Changes Needed"), validates destination cities, overwrites request destinations,
   * resets status to "Pending Review", logs the update, and notifies the assigned admin.
   * Input: req (RequestInterface) - the authenticated request with session info,
   *        id (string) - UUID of the request to update,
   *        data (UpdateRequestDto) - the updated request fields.
   * Output: the updated Request entity.
   */
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
      if (!entity) throw new NotFoundException(`Request ${id} not found`);

      if (req.sessionInfo.id !== entity.id_user)
        throw new UnauthorizedException('Unable to edit this request.');

      //Un request solo puede ser editado si esta en estos estados
      if (
        entity.status !== 'Pending Review' &&
        entity.status !== 'Changes Needed'
      )
        throw new ConflictException(
          'Unable to edit this request beacuse of its current status.',
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
      entity.advance_money = data.advance_money;
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
        throw new NotFoundException(`Admin with ID ${updated.id_admin} not found.`);
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

  /**
   * getRequestById, retrieves a single request entity by its ID.
   * Input: id (string) - UUID of the request.
   * Output: the Request entity if found; throws NotFoundException otherwise.
   */
  async getRequestById(id: string): Promise<RequestEntity> {
    const request = await this.requestsRepo.findOne({
      where: { id },
    });
    if (!request) {
      throw new NotFoundException(`Request with ID ${id} not found.`);
    }
    return request;
  }

  /**
   * updateStatus, updates the status of a request and logs the status change.
   * Input: id (string) - UUID of the request,
   *        newStatus (string) - the new status to set on the request.
   * Output: the updated Request entity with the new status.
   */
  async updateStatus(id: string, newStatus: string): Promise<RequestEntity> {
    const request = await this.requestsRepo.findOne({ where: { id } });

    if (!request) {
      throw new Error('Request not found');
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