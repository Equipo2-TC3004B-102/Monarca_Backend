/**
 * FileName: destinations.checks.ts
 * Description: Service providing destination validation utilities. Includes methods
 *              to check if a destination exists by ID and to retrieve a city name by ID.
 * Authors: Original Monarca team
 * Last Modification made:
 * 25/02/2026 [Sergio Jiawei Xuan] Added detailed comments and documentation for clarity and maintainability.
 */

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Destination } from './entities/destination.entity';
import { CreateDestinationDto } from './dto/create-destination.dto';
import { UpdateDestinationDto } from './dto/update-destination.dto';

@Injectable()
export class DestinationsChecks {
  constructor(
    @InjectRepository(Destination)
    private readonly destRepo: Repository<Destination>,
  ) {}

  async isValid(id: string): Promise<Boolean> {
    const dest = await this.destRepo.findOneBy({ id });

    return !!dest;
  }

  async getCityNameById(id: string): Promise<string> {
    const dest = await this.destRepo.findOneBy({ id });
    return dest?.city || 'Unknown city';
  }
}
