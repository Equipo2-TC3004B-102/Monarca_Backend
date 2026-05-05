/**
 * FileName: user.checks.service.ts
 * Description: Service providing user validation and lookup utilities. Includes
 *              methods for login validation, retrieving a user by ID with relations,
 *              and randomly selecting an approver or SOI user for request assignment.
 * Authors: Original Monarca team
 * Last Modification made:
 * 05/05/2026 [Santiago Coronado Hernández] Added id_company to getUserById select.
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
      select: ['id', 'name', 'last_name', 'email', 'role', 'is_system_admin', 'is_company_admin', 'is_requester', 'is_approver', 'is_soi', 'is_travelAgent', 'id_company'],
      relations: ['role', 'role.permissions'],
    });

    if (!user) return null;

    return user;
  }

  /**
   * getApproverIdFromManagerChain, resolves an approver using manager hierarchy.
   * Input: id_user (string), max_levels (number) hierarchy depth to evaluate, id_company (string) company scope.
   * Output: Approver user id when found in hierarchy within the same company, otherwise null.
   */
  async getApproverIdFromManagerChain(
    id_user: string,
    max_levels: number = 2,
    id_company?: string,
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

      const query = this.userRepository
        .createQueryBuilder('u')
        .where('u.id = :managerId', { managerId })
        .andWhere('u.is_approver = :isApprover', { isApprover: true })
        .andWhere('LOWER(u.status) = :status', { status: 'active' });

      if (id_company) {
        query.andWhere('u.id_company = :id_company', { id_company });
      }

      const managerAsApprover = await query.select('u.id', 'id').getRawOne<{ id: string }>();

      if (managerAsApprover?.id) {
        return managerAsApprover.id;
      }

      currentUserId = managerId;
    }

    return null;
  }

  /**
   * getApproverIdByCompany, resolves an active approver inside the requester's company.
   * Input: id_company (string), id_user (string).
   * Output: Approver user id when available, otherwise null.
   */
  async getApproverIdByCompany(
    id_company: string,
    id_user: string,
  ): Promise<string | null> {
    const approvers = await this.userRepository
      .createQueryBuilder('u')
      .where('u.id != :id_user', { id_user })
      .andWhere('u.id_company = :id_company', { id_company })
      .andWhere('u.is_approver = :isApprover', { isApprover: true })
      .andWhere('LOWER(u.status) = :status', { status: 'active' })
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
   * getRandomSOIID, selects an active SOI user scoped to the given company when provided.
   * Input: id_company (string, optional) company scope.
   * Output: SOI user id when available, otherwise null.
   */
  async getRandomSOIID(id_company?: string): Promise<string | null> {
    const query = this.userRepository
      .createQueryBuilder('u')
      .where('u.is_soi = :isSoi', { isSoi: true })
      .andWhere('LOWER(u.status) = :status', { status: 'active' });

    if (id_company) {
      query.andWhere('u.id_company = :id_company', { id_company });
    }

    const sois = await query.select('u.id', 'id').getRawMany<{ id: string }>();

    if (sois.length === 0) {
      return null;
    }

    const randomIndex = Math.floor(Math.random() * sois.length);
    return sois[randomIndex].id;
  }
}
