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
    },
  ) {
    return this.settingsService.updateByCompany(id_company, body);
  }
}
