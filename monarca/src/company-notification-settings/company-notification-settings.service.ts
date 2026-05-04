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
    },
  ): Promise<CompanyNotificationSetting> {
    const settings = await this.getByCompany(id_company);

    if (body.email_enabled !== undefined) {
      settings.email_enabled = body.email_enabled;
    }

    if (body.in_app_enabled !== undefined) {
      settings.in_app_enabled = body.in_app_enabled;
    }

    return this.settingsRepository.save(settings);
  }
}
