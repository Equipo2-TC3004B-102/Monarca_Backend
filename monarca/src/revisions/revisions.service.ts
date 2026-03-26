/**
 * FileName: revisions.service
 * Description: Business logic layer for Revision operations. Validates request existence,
 *              admin ownership, and request status before persisting a revision. Sends
 *              an email notification to the requester and updates the request status
 *              to 'Changes Needed'.
 * Authors: Original Moncarca team
 * Last Modification made:
 * 25/02/2026 [Diego de la Vega] Added detailed comments and documentation for clarity and maintainability.
 */

import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { CreateRevisionDto } from './dto/create-revision.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Revision } from './entities/revision.entity';
import { RequestsService } from 'src/requests/requests.service';
import { RequestInterface } from 'src/guards/interfaces/request.interface';
import { RequestsChecks } from 'src/requests/requests.checks';
import { NotificationsService } from 'src/notifications/notifications.service';
import { UserChecks } from 'src/users/user.checks.service';

@Injectable()
export class RevisionsService {
  constructor(
    @InjectRepository(Revision)
    private readonly revisionRepository: Repository<Revision>,
    private readonly requestService: RequestsService,
    private readonly requestChecks: RequestsChecks,
    private readonly notificationsService: NotificationsService,
    private readonly userChecks: UserChecks,
  ) {}

  /**
   * create - Creates and persists a new revision after validating that the request exists,
   *          the caller is the assigned admin, and the request is in 'Pending Review' or
   *          'Changes Needed' status. Sends a notification email to the request owner
   *          and updates the request status to 'Changes Needed'.
   * Input: req (RequestInterface) - session info containing the authenticated user ID;
   *        data (CreateRevisionDto) - revision fields: id_request and comment.
   * Output: Promise<Revision> - the newly saved revision entity.
   * Throws NotFoundException if the request or user does not exist.
   * Throws UnauthorizedException if the caller is not the request admin or
   *        the request is not in a revisable status.
   */
  async create(req: RequestInterface, data: CreateRevisionDto) {
    const userId = req.sessionInfo.id;

    if (!(await this.requestChecks.requestExists(data.id_request))) {
      throw new NotFoundException('Invalid request id.');
    }

    if (!(await this.requestChecks.isRequestsAdmin(data.id_request, userId))) {
      throw new UnauthorizedException('Unable to write to that request.');
    }

    const requestStatus = await this.requestChecks.getRequestStatus(data.id_request)
    if (requestStatus !== 'Pending Review' &&
        requestStatus !== 'Changes Needed') {
      throw new UnauthorizedException('Unable to create a revision because of the requets status.');
    }

    const revision = this.revisionRepository.create({
      ...data,
      id_user: userId,
    });

    const user = await this.userChecks.getUserById(userId);
    if (!user) {
      throw new NotFoundException('User not found.');
    }

    const request = await this.requestService.getRequestById(data.id_request);
    if (!request) {
      throw new NotFoundException('Request not found.');
    }

    // Notify the user that a revision has been created
    await this.notificationsService.notify(
      user.email,
      'Solicitud con cambios necesarios',
      `Tu solicitud de viaje con el título "${request.title}" ha sido marcada con cambios necesarios.`,
      `<p>Hola ${user.name},</p>
<p>Tu solicitud de viaje con el título "<strong>${request.title}</strong>" ha sido marcada con cambios necesario. Por favor revisa los comentarios y ajusta tu solicitud.</p>
<p>Comentarios:</p>
<p>${data.comment}</p>
<p>Para más detalles, visita tu panel de solicitudes.</p>
<p>Saludos,</p>
<p>Equipo de Monarca</p>`,      
    );

    // const revision = this.revisionRepository.create(data);
    this.requestService.updateStatus(data.id_request, 'Changes Needed');
    return await this.revisionRepository.save(revision);
  }
}
