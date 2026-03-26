/**
 * FileName: revisions.controller
 * Description: REST controller for Revision operations. Exposes the endpoint for
 *              creating a revision on a travel request. All routes are protected
 *              by AuthGuard and PermissionsGuard.
 * Authors: Original Moncarca team
 * Last Modification made:
 * 25/02/2026 [Diego de la Vega] Added detailed comments and documentation for clarity and maintainability.
 */

import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { RevisionsService } from './revisions.service';
import { CreateRevisionDto } from './dto/create-revision.dto';
import { RequestInterface } from 'src/guards/interfaces/request.interface';
import { AuthGuard } from 'src/guards/auth.guard';
import { PermissionsGuard } from 'src/guards/permissions.guard';

@UseGuards(AuthGuard, PermissionsGuard)
@Controller('revisions')
export class RevisionsController {
  constructor(private readonly revisionsService: RevisionsService) {}

  /**
   * postRevision - Creates a new revision entry for a travel request.
   * Input: req (RequestInterface) - session info used to extract the authenticated admin user ID;
   *        dto (CreateRevisionDto) - revision fields: id_request and comment.
   * Output: Promise<Revision> - the newly created and persisted revision record.
   */
  @Post()
  postRevision(
    @Request() req: RequestInterface,
    @Body() dto: CreateRevisionDto,
  ) {
    // console.log(dto);
    return this.revisionsService.create(req, dto);
  }
  /* Para sacar userId de la cookie */
  // @UseGuards(AuthGuard)
  // @Post()
  // postRevision(@Body() dto : CreateRevisionDto, @Request() req)
  // {
  //     // console.log(dto);
  //     const userId = req.sessionInfo.id; // desde cookie JWT
  //     return this.revisionsService.create(dto, userId);
  // }
}
