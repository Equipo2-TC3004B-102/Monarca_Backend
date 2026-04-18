import { Test, TestingModule } from '@nestjs/testing';
import { RequestsService } from './requests.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Request as RequestEntity } from './entities/request.entity';
import { UserChecks } from 'src/users/user.checks.service';
import { DestinationsChecks } from 'src/destinations/destinations.checks';
import { NotificationsService } from 'src/notifications/notifications.service';
import { DataSource } from 'typeorm';

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
          provide: UserChecks,
          useValue: {},
        },
        {
          provide: DestinationsChecks,
          useValue: {},
        },
        {
          provide: NotificationsService,
          useValue: {},
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
      process.env = originalEnv;
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
