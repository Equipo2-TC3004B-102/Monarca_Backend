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
