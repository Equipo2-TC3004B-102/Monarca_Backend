/*
 * Filename: company-notification-settings.service.spec.ts
 * Description: Test file for the CompanyNotificationSettingsService, which handles business logic related to company notification settings.
 * Authors: DebugStudio team
 * Last Modification made: [04/05/2026] [Jinsik Yoon] Initial creation of the test file.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { CompanyNotificationSettingsService } from './company-notification-settings.service';

describe('CompanyNotificationSettingsService', () => {
  let service: CompanyNotificationSettingsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CompanyNotificationSettingsService],
    }).compile();

    service = module.get<CompanyNotificationSettingsService>(CompanyNotificationSettingsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
