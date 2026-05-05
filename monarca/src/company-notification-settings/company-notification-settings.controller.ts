/*
 * Filename: company-notification-setting.controller.ts
 * Description: Controller file for handling API requests related to company notification settings.
 * Authors: DebugStudio team
 * Last Modification made: [04/05/2026] [Jinsik Yoon] Initial creation of the controller file.
 */

import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
import { CompanyNotificationSettingsService } from './company-notification-settings.service';

@Controller('company-notification-settings')
export class CompanyNotificationSettingsController {
  constructor(
    private readonly settingsService: CompanyNotificationSettingsService,
  ) {}

  @Get(':id_company')
  getByCompany(@Param('id_company') id_company: string) {
    return this.settingsService.getByCompany(id_company);
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
  ) {
    return this.settingsService.updateByCompany(id_company, body);
  }
}
