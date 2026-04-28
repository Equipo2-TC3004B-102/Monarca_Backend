/**
 * FileName: travel-agencies.checks.ts
 * Description: Service providing travel agency validation utilities. Includes methods
 *              to check if a travel agency exists by ID and to retrieve all users
 *              belonging to a travel agency.
 * Authors: Original Monarca team
 * Last Modification made:
 * 11/04/2026 [Julio Rodriguez] Standardized client error handling to BadRequestException for HTTP 400 policy and aligned header documentation.
 */

import { BadRequestException, Injectable } from '@nestjs/common';
import {
  TravelAgencyDto,
} from './dto/travel-agency.dtos';
import { InjectRepository } from '@nestjs/typeorm';
import { TravelAgency } from './entities/travel-agency.entity';
import { Repository } from 'typeorm';

@Injectable()
export class TravelAgenciesChecks {
  constructor(
    @InjectRepository(TravelAgency)
    private readonly repo: Repository<TravelAgency>,
  ) {}

  async exists(id_travel_agency: string) {
    const travel_agency = await this.repo.findOne({
      where: { id: id_travel_agency },
    });

    return !!travel_agency;
  }

  async getTravelAgencyUsers(id_travel_agency: string) {
    const travel_agency = await this.repo.findOne({
      where: { id: id_travel_agency },
      relations: ['users'],
    });
    if (!travel_agency) {
      throw new BadRequestException('Travel agency not found');
    }
    if (travel_agency.users.length === 0) {
      throw new BadRequestException('No users found for this travel agency');
    }
    return travel_agency.users;
  }
}
