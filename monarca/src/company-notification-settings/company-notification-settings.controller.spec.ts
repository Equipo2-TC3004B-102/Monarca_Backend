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
