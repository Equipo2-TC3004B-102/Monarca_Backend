/**
 * FileName: admin.service.ts
 * Description: Service for admin operations. Provides company CRUD for system admins
 *              and user management scoped to a company for both company admins and system admins.
 *              System admins have full access; company admins are restricted to their own company
 *              and cannot set the is_system_admin flag on users.
 *              Passwords are always hashed with bcrypt before being persisted.
 * Authors: DebugStudio Team
 * Last Modification made:
 * 13/05/2026 [Julio Rodriguez] Added getCostCentersByCompany for CECO selector in AdminRules.
 *                              Added getCompanyInfo for company name display in AdminRules (accessible to company admins).
 */

import {
  BadRequestException,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Company } from 'src/companies/entity/company.entity';
import { User } from 'src/users/entities/user.entity';
import { CostCenter } from 'src/cost-centers/entity/cost-centers.entity';
import { CreateCompanyDto, UpdateCompanyDto } from 'src/companies/dto/company.dtos';
import { CreateUserDto, UpdateUserDto } from 'src/users/dto/user.dtos';
import { CompanySetupDto, FindUsersQueryDto, SetCompanyAdminDto, SetUserFlagsDto } from './dto/admin.dto';
import { UserInfoInterface } from 'src/guards/interfaces/userInfo.interface';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(CostCenter)
    private readonly costCenterRepository: Repository<CostCenter>,
  ) {}

  private clientError(message: string, code: string) {
    return new BadRequestException({ message, code });
  }

  // Companies CRUD (system admin only)

  /**
   * createCompany — Creates a new company.
   * Input: CreateCompanyDto.
   * Output: created Company entity.
   */
  async createCompany(dto: CreateCompanyDto): Promise<Company> {
    const entity = this.companyRepository.create(dto);
    return this.companyRepository.save(entity);
  }

  /**
   * findAllCompanies — Returns all companies in the system.
   * Input: none.
   * Output: Company array.
   */
  async findAllCompanies(): Promise<Company[]> {
    return this.companyRepository.find();
  }

  /**
   * findOneCompany — Returns one company by id.
   * Throws 400 if not found.
   * Input: company id.
   * Output: Company entity.
   */
  async findOneCompany(id: string): Promise<Company> {
    const entity = await this.companyRepository.findOne({ where: { id } });
    if (!entity) {
      throw this.clientError(`Company ${id} not found`, 'COMPANY_NOT_FOUND');
    }
    return entity;
  }

  /**
   * updateCompany — Updates an existing company by id.
   * Input: company id, UpdateCompanyDto.
   * Output: updated Company entity.
   */
  async updateCompany(id: string, dto: UpdateCompanyDto): Promise<Company> {
    await this.findOneCompany(id);
    await this.companyRepository.update(id, dto);
    return this.findOneCompany(id);
  }

  /**
   * removeCompany — Deletes a company by id.
   * Input: company id.
   * Output: deletion confirmation.
   */
  async removeCompany(id: string): Promise<{ status: boolean; message: string }> {
    await this.findOneCompany(id);
    await this.companyRepository.delete(id);
    return { status: true, message: `Company ${id} deleted` };
  }

  // Global user management (system admin only)

  /**
   * findAllUsers — Returns users visible to the caller.
   * System admins receive all users; company admins receive only their own company's users.
   * Input: optional query filters (name, email, employee_num), caller userInfo.
   * Output: User array.
   */
  async findAllUsers(query: FindUsersQueryDto, caller: UserInfoInterface): Promise<User[]> {
    const where: Record<string, unknown> = {};
    if (!caller.is_system_admin && caller.id_company) {
      where.id_company = caller.id_company;
    }
    if (query.name) where.name = ILike(`%${query.name}%`);
    if (query.email) where.email = ILike(`%${query.email}%`);
    if (query.employee_num) where.employee_num = ILike(`%${query.employee_num}%`);

    return this.userRepository.find({ where: Object.keys(where).length ? where : undefined });
  }

  /**
   * findOneUser — Returns one user by id.
   * Throws 400 if not found.
   * Input: user id.
   * Output: User entity.
   */
  async findOneUser(id: string): Promise<User> {
    const entity = await this.userRepository.findOne({ where: { id } });
    if (!entity) {
      throw this.clientError(`User ${id} not found`, 'USER_NOT_FOUND');
    }
    return entity;
  }

  /**
   * updateUser — Updates a user by id (system admin only — guard enforces this).
   * Hashes password if present in dto.
   * Input: user id, UpdateUserDto.
   * Output: updated User entity.
   */
  async updateUser(id: string, dto: UpdateUserDto): Promise<User> {
    await this.findOneUser(id);
    const data: UpdateUserDto = { ...dto };
    if (data.password) {
      data.password = await bcrypt.hash(data.password, 10);
    }
    await this.userRepository.update(id, data);
    return this.findOneUser(id);
  }

  /**
   * setCompanyAdmin — Sets or revokes the is_company_admin flag for a user.
   * Input: user id, SetCompanyAdminDto.
   * Output: updated User entity.
   */
  async setCompanyAdmin(userId: string, dto: SetCompanyAdminDto): Promise<User> {
    await this.findOneUser(userId);
    await this.userRepository.update(userId, { is_company_admin: dto.is_company_admin });
    return this.findOneUser(userId);
  }

  // Company scoped user management (company admin and system admin)

  /**
   * findUsersByCompany — Returns users belonging to a company with optional filters.
   * Input: company id, optional query filters (name, email, employee_num).
   * Output: User array.
   */
  async findUsersByCompany(companyId: string, query: FindUsersQueryDto): Promise<User[]> {
    await this.findOneCompany(companyId);

    const where: Record<string, unknown> = { id_company: companyId };
    if (query.name) where.name = ILike(`%${query.name}%`);
    if (query.email) where.email = ILike(`%${query.email}%`);
    if (query.employee_num) where.employee_num = ILike(`%${query.employee_num}%`);

    return this.userRepository.find({ where });
  }

  /**
   * createUserInCompany — Creates a new user in the given company.
   * Forces id_company to companyId; strips is_system_admin for non-system-admin callers.
   * Hashes the provided password before saving.
   * Input: company id, CreateUserDto, caller userInfo.
   * Output: created User without the password field.
   */
  async createUserInCompany(
    companyId: string,
    dto: CreateUserDto,
    caller: UserInfoInterface,
  ): Promise<Omit<User, 'password'>> {
    await this.findOneCompany(companyId);

    const data: CreateUserDto = { ...dto, id_company: companyId };
    if (!caller.is_system_admin) {
      data.is_system_admin = false;
    }
    data.password = await bcrypt.hash(data.password, 10);

    const entity = this.userRepository.create({
      ...data,
      user_name: data.user_name ?? data.email.split('@')[0],
      creation_date: data.creation_date ?? new Date(),
    });

    const saved = await this.userRepository.save(entity);
    const { password, ...userWithoutPassword } = saved;
    return userWithoutPassword;
  }

  /**
   * findUserInCompany — Returns one user scoped to the given company.
   * Throws 400 if the user does not exist or does not belong to the company.
   * Input: company id, user id.
   * Output: User entity.
   */
  async findUserInCompany(companyId: string, userId: string): Promise<User> {
    const entity = await this.userRepository.findOne({
      where: { id: userId, id_company: companyId },
    });
    if (!entity) {
      throw this.clientError(
        `User ${userId} not found in company ${companyId}`,
        'USER_NOT_FOUND_IN_COMPANY',
      );
    }
    return entity;
  }

  /**
   * updateUserInCompany — Updates a user scoped to the given company.
   * Strips is_system_admin from dto for non-system-admin callers.
   * Hashes password if present in dto.
   * Input: company id, user id, UpdateUserDto, caller userInfo.
   * Output: updated User entity.
   */
  async updateUserInCompany(
    companyId: string,
    userId: string,
    dto: UpdateUserDto,
    caller: UserInfoInterface,
  ): Promise<User> {
    await this.findUserInCompany(companyId, userId);

    const data: UpdateUserDto = { ...dto };
    if (!caller.is_system_admin) {
      delete data.is_system_admin;
    }
    if (data.password) {
      data.password = await bcrypt.hash(data.password, 10);
    }

    await this.userRepository.update(userId, data);
    return this.findUserInCompany(companyId, userId);
  }

  /**
   * setUserFlags — Updates role flags for a user scoped to the given company.
   * Only modifies flags present in the dto; omitted flags are left unchanged.
   * Input: company id, user id, SetUserFlagsDto.
   * Output: updated User entity.
   */
  async setUserFlags(companyId: string, userId: string, dto: SetUserFlagsDto): Promise<User> {
    await this.findUserInCompany(companyId, userId);
    await this.userRepository.update(userId, dto);
    return this.findUserInCompany(companyId, userId);
  }

  /**
   * removeUserFromCompany — Deletes a user scoped to the given company.
   * Input: company id, user id.
   * Output: deletion confirmation.
   */
  async removeUserFromCompany(
    companyId: string,
    userId: string,
  ): Promise<{ status: boolean; message: string }> {
    await this.findUserInCompany(companyId, userId);
    await this.userRepository.delete(userId);
    return { status: true, message: `User ${userId} deleted from company ${companyId}` };
  }

  /**
   * setupCompany — Creates a company and its initial company admin user in one operation.
   * The admin user gets is_company_admin: true, id_company scoped to the new company,
   * and a bcrypt-hashed default password.
   * Input: CompanySetupDto with company fields and admin user fields.
   * Output: created company and admin user (without password).
   */
  async setupCompany(
    dto: CompanySetupDto,
  ): Promise<{ company: Company; admin: Omit<User, 'password'> }> {
    const company = await this.companyRepository.save(
      this.companyRepository.create({ name: dto.name, local_currency: dto.local_currency }),
    );

    const hashedPassword = await bcrypt.hash('password', 10);
    const adminEntity = this.userRepository.create({
      name: dto.admin.name,
      last_name: dto.admin.last_name ?? '',
      email: dto.admin.email,
      employee_num: dto.admin.employee_num,
      user_name: dto.admin.email.split('@')[0],
      password: hashedPassword,
      status: 'active',
      id_company: company.id,
      is_company_admin: true,
      is_requester: true,
      is_approver: true,
      is_soi: false,
      is_travelAgent: false,
      is_system_admin: false,
      creation_date: new Date(),
    });

    const savedAdmin = await this.userRepository.save(adminEntity);
    const { password, ...adminWithoutPassword } = savedAdmin;

    return { company, admin: adminWithoutPassword };
  }

  /**
   * getCompanyInfo — Returns basic company info (id, name, local_currency) for the given company.
   * Company admins can only access their own company. System admins access any.
   * Input: company id, caller userInfo.
   * Output: Company entity.
   */
  async getCompanyInfo(companyId: string, caller: UserInfoInterface): Promise<Company> {
    if (!caller.is_system_admin && caller.id_company !== companyId) {
      throw this.clientError(
        'Access restricted to your own company',
        'ADMIN_FORBIDDEN_COMPANY',
      );
    }
    return this.findOneCompany(companyId);
  }

  /**
   * getCostCentersByCompany — Returns all cost centers belonging to a company.
   * Company admins can only access their own company. System admins access any.
   * Input: company id, caller userInfo.
   * Output: CostCenter array.
   */
  async getCostCentersByCompany(
    companyId: string,
    caller: UserInfoInterface,
  ): Promise<CostCenter[]> {
    if (!caller.is_system_admin && caller.id_company !== companyId) {
      throw this.clientError(
        'Access restricted to your own company cost centers',
        'ADMIN_FORBIDDEN_COMPANY',
      );
    }
    return this.costCenterRepository.find({ where: { id_company: companyId } });
  }
}
