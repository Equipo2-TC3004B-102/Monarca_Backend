/**
 * FileName: user.checks.service.ts
 * Description: Service providing user validation and lookup utilities. Includes
 *              methods for login validation, retrieving a user by ID with relations,
 *              and randomly selecting an approver or SOI user for request assignment.
 * Authors: Original Monarca team
 * Last Modification made:
 * 07/04/2026 [Julio Rodriguez] Authentication logging cleanup and consistency updates.
 */

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { LogInDTO } from 'src/auth/dto/login.dto';

@Injectable()
export class UserChecks {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async logIn(data: LogInDTO): Promise<User | null> {
    const user = await this.userRepository.findOne({
      where: { email: data.email },
      relations: ['role', 'role.permissions'],
    });

    if (!user) return null;

    return user;
  }
  async getUserById(id: string): Promise<User | null> {
    const user = await this.userRepository.findOne({
      where: { id: id },
      select: ['id', 'name', 'email', 'last_name', 'role'],
      relations: ['role', 'role.permissions'],
    });

    if (!user) return null;

    return user;
  }

  async getRandomApproverID(): Promise<string | null> {
    const approvers = await this.userRepository.find({
      where: {
        role: {
          name: 'Aprobador',
        },
      },
      select: ['id'],
      relations: [],
    });

    // console.log(approvers)

    if (approvers.length === 0) {
      return null;
    }

    const randomIndex = Math.floor(Math.random() * approvers.length);

    return approvers[randomIndex].id;
  }

  async getRandomApproverIdFromSameCostCenter(
    id_cost_center: string,
    id_user: string,
  ): Promise<string | null> {
    const approvers = await this.userRepository
      .createQueryBuilder('u')
      .innerJoin('u.role', 'role')
      .where('u.id != :id_user', { id_user })
      .andWhere('u.id_ceco = :id_cost_center', { id_cost_center })
      .andWhere('role.name = :roleName', { roleName: 'Aprobador' })
      .select('u.id', 'id')
      .getRawMany<{ id: string }>();

    if (approvers.length === 0) {
      return null;
    }

    const randomIndex = Math.floor(Math.random() * approvers.length);

    return approvers[randomIndex].id;
  }
  

  async getRandomSOIID(): Promise<string | null> {
    const SOIs = await this.userRepository.find({
      where: {
        role: {
          name: 'SOI',
        },
      },
      select: ['id'],
      relations: [],
    });

    // console.log(approvers)

    if (SOIs.length === 0) {
      return null;
    }

    const randomIndex = Math.floor(Math.random() * SOIs.length);

    return SOIs[randomIndex].id;
  }
}
