/**
 * FileName: reservations.controller
 * Description: REST controller for Reservation operations. Exposes endpoints for
 *              creating (with PDF upload), retrieving, updating, and deleting reservations.
 *              All routes are protected by AuthGuard and PermissionsGuard.
 * Authors: Original Moncarca team
 * Last Modification made:
 * 25/02/2026 [Diego de la Vega] Added detailed comments and documentation for clarity and maintainability.
 */

import {
  Controller,
  Get,
  Post,
  Param,
  Patch,
  Delete,
  Body,
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

@UseGuards(AuthGuard,PermissionsGuard)
@Controller('reservations')
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  /**
   * createReservation - Handles optional PDF file upload and creates a new reservation.
   *                      Builds the public file URL from the upload and merges it into the DTO.
   * Input: req (RequestInterface) - session info used to verify the travel agency;
   *        files - optional uploaded PDF file via multipart form data;
   *        createReservationDto (CreateReservationDto) - reservation fields: title, comments,
   *        price, id_request_destination.
   * Output: Promise<Reservation> - the newly created and persisted reservation record.
   */
  @UseInterceptors(UploadPdfInterceptor())
  @Post()
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
      } }
    return this.reservationsService.createReservation(req, 
      {
        ...createReservationDto,
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
  async findAll() {
    return this.reservationsService.findAll();
  }

  /**
   * findOne - Retrieves a single reservation by its UUID.
   * Input: id (string) - UUID of the reservation to retrieve (validated by ParseUUIDPipe).
   * Output: Promise<Reservation> - the matching reservation record.
   */
  @Get(':id')
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
  async remove(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.reservationsService.remove(id);
  }
}
