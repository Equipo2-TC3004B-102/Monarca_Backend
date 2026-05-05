/*
 * Filename: company-notification-settings.service.ts
 * Description: Service file for handling business logic related to company notification settings.
 * Authors: DebugStudio team
 * Last Modification made: [04/05/2026] [Jinsik Yoon] Initial creation of the service file.
 */

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CompanyNotificationSetting } from './entities/company-notification-setting.entity';

@Injectable()
export class CompanyNotificationSettingsService {
  constructor(
    @InjectRepository(CompanyNotificationSetting)
    private readonly settingsRepository: Repository<CompanyNotificationSetting>,
  ) {}

  async getByCompany(id_company: string): Promise<CompanyNotificationSetting> {
    let settings = await this.settingsRepository.findOne({
      where: { id_company },
    });

    if (!settings) {
      settings = this.settingsRepository.create({
        id_company,
        email_enabled: true,
        in_app_enabled: true,
        email_requests_created: true,
        email_requests_status: true,
        email_revisions: true,
        email_reservations: true,
        email_admin_alerts: true,
      });

      settings = await this.settingsRepository.save(settings);
    }

    return settings;
  }

  async updateByCompany(
    id_company: string,
    body: {
      email_enabled?: boolean;
      in_app_enabled?: boolean;
      email_requests_created?: boolean;
      email_requests_status?: boolean;
      email_revisions?: boolean;
      email_reservations?: boolean;
      email_admin_alerts?: boolean;
    },
  ): Promise<CompanyNotificationSetting> {
    const settings = await this.getByCompany(id_company);

    if (body.email_enabled !== undefined) {
      settings.email_enabled = body.email_enabled;
    }

    if (body.in_app_enabled !== undefined) {
      settings.in_app_enabled = body.in_app_enabled;
    }

    if (body.email_requests_created !== undefined) {
      settings.email_requests_created = body.email_requests_created;
    }

    if (body.email_requests_status !== undefined) {
      settings.email_requests_status = body.email_requests_status;
    }

    if (body.email_revisions !== undefined) {
      settings.email_revisions = body.email_revisions;
    }

    if (body.email_reservations !== undefined) {
      settings.email_reservations = body.email_reservations;
    }

    if (body.email_admin_alerts !== undefined) {
      settings.email_admin_alerts = body.email_admin_alerts;
    }

    return this.settingsRepository.save(settings);
  }
}
