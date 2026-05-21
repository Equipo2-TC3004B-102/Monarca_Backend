/*
 * Filename: company-notification-setting.controller.ts
 * Description: Controller file for handling API requests related to company notification settings.
 * Authors: DebugStudio team
 * Last Modification made:
 * [19/05/2026] [Julio Rodriguez] Add AuthGuard, PermissionsGuard, CompanyAdminGuard; pass userInfo to service for company-admin-only validation.
 */

import { Body, Controller, Get, Param, Patch, Request, UseGuards } from '@nestjs/common';
import { CompanyNotificationSettingsService } from './company-notification-settings.service';
import { AuthGuard } from 'src/guards/auth.guard';
import { PermissionsGuard } from 'src/guards/permissions.guard';
import { CompanyAdminGuard } from 'src/guards/company-admin.guard';
import { RequestInterface } from 'src/guards/interfaces/request.interface';

@UseGuards(AuthGuard, PermissionsGuard, CompanyAdminGuard)
@Controller('company-notification-settings')
export class CompanyNotificationSettingsController {
  constructor(
    private readonly settingsService: CompanyNotificationSettingsService,
  ) {}

  @Get(':id_company')
  getByCompany(
    @Param('id_company') id_company: string,
    @Request() req: RequestInterface,
  ) {
    return this.settingsService.getByCompany(id_company, req.userInfo);
  }

  @Patch(':id_company')
  updateByCompany(
    @Param('id_company') id_company: string,
    @Body()
    body: {
      email_enabled?: boolean;
      in_app_enabled?: boolean;
      email_requests_created?: boolean;
      email_requests_status?: boolean;
      email_revisions?: boolean;
      email_reservations?: boolean;
      email_admin_alerts?: boolean;
    },
    @Request() req: RequestInterface,
  ) {
    return this.settingsService.updateByCompany(id_company, body, req.userInfo);
  }
}
