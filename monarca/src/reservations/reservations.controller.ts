/**
 * FileName: reservations.controller
 * Description: REST controller for Reservation operations. Exposes endpoints for
 *              creating (with PDF upload), retrieving, updating, and deleting reservations.
 *              All routes are protected by AuthGuard and PermissionsGuard.
 * Authors: Original Moncarca team
 * Last Modification made:
 * 27/05/2026 [Julio Rodriguez] PDF upload is now required for ALL reservations (including Duffel).
 *                              Raw `link` is stripped from DTO body; only file uploads set it.
 */

import {
  Controller,
  Get,
  Post,
  Param,
  Patch,
  Delete,
  Body,
  HttpCode,
  ParseUUIDPipe,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFiles
} from '@nestjs/common';
import { ReservationsService } from './reservations.service';
import {
  CreateReservationDto,
  UpdateReservationDto,
} from './dto/reservation.dtos';
import { AuthGuard } from 'src/guards/auth.guard';
import { PermissionsGuard } from 'src/guards/permissions.guard';
import { RequestInterface } from 'src/guards/interfaces/request.interface';
import { UploadPdfInterceptor } from 'src/utils/uploadPdf.middleware';
import { Permissions } from 'src/guards/decorators/permission.decorator';

@UseGuards(AuthGuard,PermissionsGuard)
@Controller('reservations')
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  /**
   * createReservation - Handles PDF file upload and creates a new reservation.
   *                      A PDF file is required for ALL reservations, including provider-based
   *                      bookings (e.g. Duffel). The raw `link` field from the DTO body is
   *                      intentionally stripped; `link` is only set from the uploaded file.
   *                      This prevents provider booking URLs from bypassing the PDF requirement.
   * Input: req (RequestInterface) - session info used to verify the travel agency;
   *        files - PDF file via multipart form data (required for all reservations);
   *        createReservationDto (CreateReservationDto) - reservation fields: title, comments,
   *        price, id_request_destination, and optional provider_id / provider_name.
   * Output: Promise<Reservation> - the newly created and persisted reservation record.
   */
  @UseInterceptors(UploadPdfInterceptor())
  @Post()
  @Permissions('submit_reservations') // Add appropriate permission for creating reservations.
  @HttpCode(200)
  async createReservation(
    @Request() req : RequestInterface,
    @UploadedFiles()
        files: {
          file?: Express.Multer.File[];
        },
    @Body() createReservationDto: CreateReservationDto,
    ) {
      // flatten both arrays into one list
    const uploaded = [
      ...(files.file || []),

    ];

    const fileMap: Record<string, string> = {};

    for (const file of uploaded) {
      const publicUrl = `${process.env.DOWNLOAD_LINK}/files/reservations/${file.filename}`;
      if (file.fieldname === 'file') {
        fileMap.link = publicUrl;
      }
    }

    // Strip the raw `link` from the DTO body so that provider booking URLs
    // (e.g. Duffel order URLs) cannot bypass the PDF requirement.
    // `link` is only ever set from the uploaded file via fileMap above.
    const { link: _bodyLink, ...dtoWithoutLink } = createReservationDto;

    return this.reservationsService.createReservation(req,
      {
        ...dtoWithoutLink,
        ...fileMap,
      } as CreateReservationDto
    );

  }

  /**
   * findAll - Retrieves all reservations stored in the database.
   * Input: None
   * Output: Promise<Reservation[]> - array of all reservation records.
   */
  @Get()
  @Permissions('send_reservation_receipts') // Add appropriate permission for retrieving reservations.
  async findAll() {
    return this.reservationsService.findAll();
  }

  /**
   * findOne - Retrieves a single reservation by its UUID.
   * Input: id (string) - UUID of the reservation to retrieve (validated by ParseUUIDPipe).
   * Output: Promise<Reservation> - the matching reservation record.
   */
  @Get(':id')
  @Permissions('send_reservation_receipts') // Add appropriate permission for retrieving reservations.
  async findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.reservationsService.findOne(id);
  }

  /**
   * update - Partially updates an existing reservation's fields by its UUID.
   * Input: id (string) - UUID of the reservation to update (validated by ParseUUIDPipe);
   *        updateReservationDto (UpdateReservationDto) - optional fields to apply.
   * Output: Promise<UpdateResult> - TypeORM update result.
   */
  @Patch(':id')
  @Permissions('submit_reservations') // Add appropriate permission for updating reservations.
  async update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() updateReservationDto: UpdateReservationDto,
  ) {
    return this.reservationsService.update(id, updateReservationDto);
  }

  /**
   * remove - Deletes a reservation record by its UUID.
   * Input: id (string) - UUID of the reservation to delete (validated by ParseUUIDPipe).
   * Output: Promise<{ message: string; status: boolean }> - confirmation message and success flag.
   */
  @Delete(':id')
  @Permissions('submit_reservations') // Add appropriate permission for deleting reservations.
  async remove(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.reservationsService.remove(id);
  }
}
