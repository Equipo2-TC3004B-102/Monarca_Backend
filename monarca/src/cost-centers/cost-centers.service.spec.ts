/**
 * FileName: cost-centers.service.spec.ts
 * Description: Test suite for CostCentersService. Contains unit tests to validate cost center creation, retrieval, and deletion logic, including company association validation and duplicate ID checks. Ensures that business rules are enforced and data integrity is maintained.
 * Authors: DebugStudio Team
 * Last Modification made: 
 * 31/05/2026 [Jin Sik Yoon] Implemented unit tests for CostCentersService covering cost center creation, retrieval, and deletion scenarios.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException } from '@nestjs/common';

import { CostCentersService } from './cost-centers.service';
import { CostCenter } from './entity/cost-centers.entity';

describe('CostCentersService', () => {
  let service: CostCentersService;

  const mockRepo = {
    findOneBy: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CostCentersService,
        {
          provide: getRepositoryToken(CostCenter),
          useValue: mockRepo,
        },
      ],
    }).compile();

    service = module.get<CostCentersService>(CostCentersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create a cost center', async () => {
    const dto = {
      id: 'TEC-001',
      name: 'Finance',
      id_company: 'company-1',
    };

    mockRepo.findOneBy.mockResolvedValue(null);
    mockRepo.create.mockReturnValue(dto);
    mockRepo.save.mockResolvedValue(dto);

    const result = await service.create('company-1', dto);

    expect(result.id).toBe('TEC-001');
    expect(mockRepo.save).toHaveBeenCalled();
  });

  it('should reject company mismatch', async () => {
    const dto = {
      id: 'TEC-001',
      name: 'Finance',
      id_company: 'different-company',
    };

    await expect(
      service.create('company-1', dto),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('should reject duplicate cost center id', async () => {
    mockRepo.findOneBy.mockResolvedValue({
      id: 'TEC-001',
    });

    const dto = {
      id: 'TEC-001',
      name: 'Finance',
      id_company: 'company-1',
    };

    await expect(
      service.create('company-1', dto),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('should find a cost center', async () => {
    mockRepo.findOneBy.mockResolvedValue({
      id: 'TEC-001',
      name: 'Finance',
      id_company: 'company-1',
    });

    const result = await service.findOne(
      'company-1',
      'TEC-001',
    );

    expect(result.id).toBe('TEC-001');
  });

  it('should throw when cost center does not exist', async () => {
    mockRepo.findOneBy.mockResolvedValue(null);

    await expect(
      service.findOne('company-1', 'INVALID'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('should remove a cost center', async () => {
    mockRepo.findOneBy.mockResolvedValue({
      id: 'TEC-001',
      id_company: 'company-1',
    });

    mockRepo.delete.mockResolvedValue({});

    const result = await service.remove(
      'company-1',
      'TEC-001',
    );

    expect(result.status).toBe(true);
  });
});