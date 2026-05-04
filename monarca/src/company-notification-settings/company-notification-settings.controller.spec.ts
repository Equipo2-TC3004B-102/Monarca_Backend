/*
 * Filename: company-notification-setting.controller.spec.ts
 * Description: Test file for the CompanyNotificationSettingsController, which handles API requests related to company notification settings.
 * Authors: DebugStudio team
 * Last Modification made: [04/05/2026] [Jinsik Yoon] Initial creation of the test file.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { CompanyNotificationSettingsController } from './company-notification-settings.controller';

describe('CompanyNotificationSettingsController', () => {
  let controller: CompanyNotificationSettingsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CompanyNotificationSettingsController],
    }).compile();

    controller = module.get<CompanyNotificationSettingsController>(CompanyNotificationSettingsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
