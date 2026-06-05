/**
 * FileName: user.checks.service.ts
 * Description: Service providing user validation and lookup utilities. Includes
 *              methods for login validation, retrieving a user by ID with relations,
 *              and randomly selecting an approver or SOI user for request assignment.
 * Authors: Original Monarca team
 * Last Modification made:
 * 01/06/2026 [Julio Rodriguez] getApproverIdFromManagerChain: excludes company admins. Replaced getApproverIdByCompany with getChainFallbackApprover: walks chain indefinitely excluding company admins.
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
   * recordLogin — Updates login timestamps on every login.
   * Sets last_login_at to now; on first login also sets first_login_at and flips is_first_login to false.
   * Input: userId (string).
   * Output: { isFirstLogin } — true only on the very first login.
   */
  async recordLogin(userId: string): Promise<{ isFirstLogin: boolean }> {
    const user = await this.userRepository.findOne({ where: { id: userId }, select: ['id', 'is_first_login'] });
    const isFirstLogin = user?.is_first_login === true;
    const update: Partial<User> = { last_login_at: new Date() };
    if (isFirstLogin) {
      update.first_login_at = new Date();
      update.is_first_login = false;
    }
    await this.userRepository.update(userId, update);
    return { isFirstLogin };
  }

  /**
   * logIn, validates credentials context by fetching user data with role and permissions.
   * Input: data (LogInDTO) containing login payload.
   * Output: User when email exists, otherwise null.
   */
  async logIn(data: LogInDTO): Promise<User | null> {
    const user = await this.userRepository.findOne({
      where: { email: data.email },
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
      select: ['id', 'name', 'last_name', 'email', 'is_system_admin', 'is_company_admin', 'is_requester', 'is_approver', 'is_soi', 'is_travelAgent', 'id_company'],
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
        .andWhere('LOWER(u.status) = :status', { status: 'active' })
        .andWhere('u.is_company_admin = :isCompanyAdmin', { isCompanyAdmin: false });

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
   * getChainFallbackApprover — Walks the manager_id chain from the requester upward without
   * a level cap. Returns the first active, non-company-admin approver found in the chain.
   * Used when the configured level_order yields no qualifying approver (e.g. direct manager inactive).
   * Input: id_user (string), id_company (string).
   * Output: Approver user id when found, otherwise null.
   */
  async getChainFallbackApprover(
    id_user: string,
    id_company: string,
  ): Promise<string | null> {
    const visited = new Set<string>();
    let currentUserId: string | null = id_user;

    while (currentUserId) {
      if (visited.has(currentUserId)) break;
      visited.add(currentUserId);

      const currentUser = await this.userRepository.findOne({
        where: { id: currentUserId },
        select: ['id', 'manager_id'],
      });

      const managerId = currentUser?.manager_id;
      if (!managerId) break;

      const manager = await this.userRepository
        .createQueryBuilder('u')
        .where('u.id = :managerId', { managerId })
        .andWhere('u.is_approver = :isApprover', { isApprover: true })
        .andWhere('LOWER(u.status) = :status', { status: 'active' })
        .andWhere('u.is_company_admin = :isCompanyAdmin', { isCompanyAdmin: false })
        .andWhere('u.id_company = :id_company', { id_company })
        .select('u.id', 'id')
        .getRawOne<{ id: string }>();

      if (manager?.id) return manager.id;

      currentUserId = managerId;
    }

    return null;
  }

  /**
   * isEligibleApprover — Validates that a specific user can act as an approver for a request.
   * Requires: not the requester, exists, is_approver, active status, not a company admin,
   * and belongs to the given company. Used to validate USER-type approval actors.
   * Input: id_user (string), id_company (string), requesterId (string).
   * Output: true when the user is an eligible approver, otherwise false.
   */
  async isEligibleApprover(
    id_user: string,
    id_company: string,
    requesterId: string,
  ): Promise<boolean> {
    if (!id_user || id_user === requesterId) return false;
    const user = await this.userRepository.findOne({
      where: { id: id_user },
      select: ['id', 'is_approver', 'status', 'is_company_admin', 'id_company'],
    });
    return (
      !!user &&
      user.is_approver === true &&
      user.status?.toLowerCase() === 'active' &&
      user.is_company_admin === false &&
      user.id_company === id_company
    );
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
