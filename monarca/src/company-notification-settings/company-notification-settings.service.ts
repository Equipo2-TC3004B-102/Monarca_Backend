/*
 * Filename: company-notification-settings.service.ts
 * Description: Service file for handling business logic related to company notification settings.
 * Authors: DebugStudio team
 * Last Modification made:
 * [04/05/2026] [Jinsik Yoon] Initial creation of the service file.
 * [19/05/2026] [Julio Rodriguez] Add userInfo param; enforce company-admin-only and company ownership checks. Extract getSettingsInternal for service-to-service calls.
 */

import { ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CompanyNotificationSetting } from './entities/company-notification-setting.entity';
import { UserInfoInterface } from 'src/guards/interfaces/userInfo.interface';

@Injectable()
export class CompanyNotificationSettingsService {
  constructor(
    @InjectRepository(CompanyNotificationSetting)
    private readonly settingsRepository: Repository<CompanyNotificationSetting>,
  ) {}

  private assertCompanyAccess(id_company: string, userInfo: UserInfoInterface): void {
    if (!userInfo.is_company_admin) {
      throw new ForbiddenException('Access restricted to company administrators');
    }
    if (userInfo.id_company !== id_company) {
      throw new ForbiddenException('Access restricted to administrators of this company');
    }
  }

  // For service-to-service calls (e.g. NotificationsService checking email settings). No auth check — callers are trusted internal services.
  async getSettingsInternal(id_company: string): Promise<CompanyNotificationSetting> {
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

  async getByCompany(id_company: string, userInfo: UserInfoInterface): Promise<CompanyNotificationSetting> {
    this.assertCompanyAccess(id_company, userInfo);
    return this.getSettingsInternal(id_company);
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
    userInfo: UserInfoInterface,
  ): Promise<CompanyNotificationSetting> {
    this.assertCompanyAccess(id_company, userInfo);
    const settings = await this.getSettingsInternal(id_company);

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
