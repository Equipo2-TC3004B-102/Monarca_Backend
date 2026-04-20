/**
 * FileName: user.checks.service.ts
 * Description: Service providing user validation and lookup utilities. Includes
 *              methods for login validation, retrieving a user by ID with relations,
 *              and randomly selecting an approver or SOI user for request assignment.
 * Authors: Original Monarca team
 * Last Modification made:
 * 18/04/2026 [Julio Rodriguez] Authentication logging cleanup and consistency updates.
 *                              Added comments for better documentation and maintainability.   
 *                              Modified getRandomApproverIdFromSameCostCenter to prioritize older approvers for better load distribution.
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

  /**
   * logIn, validates credentials context by fetching user data with role and permissions.
   * Input: data (LogInDTO) containing login payload.
   * Output: User when email exists, otherwise null.
   */
  async logIn(data: LogInDTO): Promise<User | null> {
    const user = await this.userRepository.findOne({
      where: { email: data.email },
      relations: ['role', 'role.permissions'],
    });

    if (!user) return null;

    return user;
  }

  /**
   * getUserById, retrieves a user by id with role and permissions information.
   * Input: id (string) user identifier.
   * Output: User when found, otherwise null.
   */
  async getUserById(id: string): Promise<User | null> {
    const user = await this.userRepository.findOne({
      where: { id: id },
      select: ['id', 'name', 'email', 'last_name', 'role'],
      relations: ['role', 'role.permissions'],
    });

    if (!user) return null;

    return user;
  }

  /**
   * getRandomApproverID, selects a random approver from all available approver users.
   * Input: none.
   * Output: Approver user id when available, otherwise null.
   */
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

  /**
   * getApproverIdFromManagerChain, resolves an approver using manager hierarchy.
   * Input: id_user (string), max_levels (number) hierarchy depth to evaluate.
   * Output: Approver user id when found in hierarchy, otherwise null.
   */
  async getApproverIdFromManagerChain(
    id_user: string,
    max_levels: number = 2,
  ): Promise<string | null> {
    let currentUserId: string | null = id_user;

    for (let level = 0; level < max_levels; level++) {
      if (!currentUserId) {
        return null;
      }

      const currentUser = await this.userRepository.findOne({
        where: { id: currentUserId },
        select: ['id', 'manager_id'],
      });

      const managerId = currentUser?.manager_id;
      if (!managerId) {
        return null;
      }

      const managerAsApprover = await this.userRepository
        .createQueryBuilder('u')
        .innerJoin('u.role', 'role')
        .where('u.id = :managerId', { managerId })
        .andWhere('role.name = :roleName', { roleName: 'Aprobador' })
        .andWhere('LOWER(u.status) = :status', { status: 'active' })
        .select('u.id', 'id')
        .getRawOne<{ id: string }>();

      if (managerAsApprover?.id) {
        return managerAsApprover.id;
      }

      currentUserId = managerId;
    }

    return null;
  }

  /**
   * getRandomApproverIdFromSameCostCenter, resolves an approver from the same CeCo with optional company filter.
   * Input: id_cost_center (string), id_user (string), id_company (string, optional).
   * Output: Approver user id when available, otherwise null.
   */
  async getRandomApproverIdFromSameCostCenter(
    id_cost_center: string,
    id_user: string,
    id_company?: string,
  ): Promise<string | null> {
    const query = this.userRepository
      .createQueryBuilder('u')
      .innerJoin('u.role', 'role')
      .where('u.id != :id_user', { id_user })
      .andWhere('u.id_ceco = :id_cost_center', { id_cost_center })
      .andWhere('role.name = :roleName', { roleName: 'Aprobador' });

    if (id_company) {
      query.andWhere('u.id_company = :id_company', { id_company });
    }

    const approvers = await query
      .orderBy('u.created_at', 'ASC')
      .addOrderBy('u.id', 'ASC')
      .select('u.id', 'id')
      .getRawMany<{ id: string }>();

    if (approvers.length === 0) {
      return null;
    }

    return approvers[0].id;
  }

  /**
   * getApproverIdByCompany, resolves an approver inside the requester's company.
   * Input: id_company (string), id_user (string).
   * Output: Approver user id when available, otherwise null.
   */
  async getApproverIdByCompany(
    id_company: string,
    id_user: string,
  ): Promise<string | null> {
    const approvers = await this.userRepository
      .createQueryBuilder('u')
      .innerJoin('u.role', 'role')
      .where('u.id != :id_user', { id_user })
      .andWhere('u.id_company = :id_company', { id_company })
      .andWhere('role.name = :roleName', { roleName: 'Aprobador' })
      .orderBy('u.created_at', 'ASC')
      .addOrderBy('u.id', 'ASC')
      .select('u.id', 'id')
      .getRawMany<{ id: string }>();

    if (approvers.length === 0) {
      return null;
    }

    return approvers[0].id;
  }

  /**
   * getRandomSOIID, selects a SOI user without company filtering (SOI is global).
   * Input: none.
   * Output: SOI user id when available, otherwise null.
   */
  async getRandomSOIID(): Promise<string | null> {
    const sois = await this.userRepository
      .createQueryBuilder('u')
      .innerJoin('u.role', 'role')
      .where('role.name = :roleName', { roleName: 'SOI' })
      .select('u.id', 'id')
      .getRawMany<{ id: string }>();

    if (sois.length === 0) {
      return null;
    }

    const randomIndex = Math.floor(Math.random() * sois.length);
    return sois[randomIndex].id;
  }
}
