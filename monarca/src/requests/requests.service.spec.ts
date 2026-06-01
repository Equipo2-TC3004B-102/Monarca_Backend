/**
 * FileName: requests.service.spec.ts
 * Description: Test suite for RequestsService. Contains unit tests to validate request creation logic, including requester cost center validation and Banxico rate fetching. Ensures that business rules are enforced and external API interactions are handled correctly.
 * Authors: DebugStudio Team
 * Last Modification made: 
 * 31/05/2026 [Jin Sik Yoon] Implemented unit tests for RequestsService covering request creation and Banxico rate fetching scenarios.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { RequestsService } from './requests.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Request as RequestEntity } from './entities/request.entity';
import { UserChecks } from 'src/users/user.checks.service';
import { DestinationsChecks } from 'src/destinations/destinations.checks';
import { NotificationsService } from 'src/notifications/notifications.service';
import { DataSource } from 'typeorm';
import { ApprovalLevel } from 'src/approval-engine/entities/approval-level.entity';
import { RequestApproval } from 'src/approval-engine/entities/request-approval.entity';
import { UserLogsService } from 'src/user-logs/user-logs.service';

describe('RequestsService', () => {
  let service: RequestsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RequestsService,
        {
          provide: getRepositoryToken(RequestEntity),
          useValue: {},
        },
        {
          provide: getRepositoryToken(ApprovalLevel),
          useValue: {},
        },
        {
          provide: getRepositoryToken(RequestApproval),
          useValue: {},
        },
        {
          provide: UserChecks,
          useValue: {},
        },
        {
          provide: DestinationsChecks,
          useValue: {
            isValid: jest.fn().mockResolvedValue(true),
          },
        },
        {
          provide: NotificationsService,
          useValue: {},
        },
        {
          provide: UserLogsService,
          useValue: {
            create: jest.fn(),
          },
        },
        {
          provide: DataSource,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<RequestsService>(RequestsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should reject request creation when requester has no cost center', async () => {
    const req: any = {
      sessionInfo: { id: 'requester-id' },
      userInfo: {
        id_company: 'company-id',
        id_ceco: null,
      },
      ip: '127.0.0.1',
    };

    const data: any = {
      id_origin_city: 'origin-city-id',
      requests_destinations: [
        {
          id_destination: 'destination-city-id',
        },
      ],
    };

    await expect(service.create(req, data)).rejects.toMatchObject({
      response: {
        code: 'REQUESTS_REQUESTER_CECO_REQUIRED',
      },
    });
  });

  describe('fetchBanxicoRate', () => {
    let originalEnv: NodeJS.ProcessEnv;
    let originalFetch: typeof fetch;

    beforeEach(() => {
      originalEnv = process.env;
      process.env = { ...originalEnv };
      originalFetch = global.fetch;
      global.fetch = jest.fn();
    });

    afterEach(() => {
      process.env = { ...originalEnv };
      global.fetch = originalFetch;
      jest.restoreAllMocks();
    });

    it('should return null if currency does not have a mapped banxicoId', async () => {
      const result = await service['fetchBanxicoRate']('INVALID_CURRENCY');
      expect(result).toBeNull();
    });

    it('should return null and warn if BMX-TOKEN is missing', async () => {
      delete process.env['BMX-TOKEN'];
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      const result = await service['fetchBanxicoRate']('USD');
      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith('BMX-TOKEN is not set in environment.');
    });

    it('should return null and log error if fetch response is not ok', async () => {
      process.env['BMX-TOKEN'] = 'fake-token';
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        statusText: 'Not Found',
      });

      const result = await service['fetchBanxicoRate']('USD');
      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith('Banxico API error: Not Found');
    });

    it('should return null if API returns no data', async () => {
      process.env['BMX-TOKEN'] = 'fake-token';
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ bmx: { series: [{ datos: [] }] } }),
      });

      const result = await service['fetchBanxicoRate']('USD');
      expect(result).toBeNull();
    });

    it('should return the parsed rate upon successful API response', async () => {
      process.env['BMX-TOKEN'] = 'fake-token';
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          bmx: {
            series: [{ datos: [{ dato: '20.55' }] }]
          }
        }),
      });

      const result = await service['fetchBanxicoRate']('USD');
      expect(result).toBe(20.55);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://www.banxico.org.mx/SieAPIRest/service/v1/series/SF43718/datos/oportuno',
        {
          method: 'GET',
          headers: {
            'Bmx-Token': 'fake-token',
            'Accept': 'application/json',
          },
        }
      );
    });

    it('should return null and log error if fetch throws an exception', async () => {
      process.env['BMX-TOKEN'] = 'fake-token';
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      const error = new Error('Network failure');
      (global.fetch as jest.Mock).mockRejectedValueOnce(error);

      const result = await service['fetchBanxicoRate']('USD');
      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith('Failed to fetch from Banxico API:', error);
    });
  });
});
