/**
 * FileName: admin.service.ts
 * Description: Service for admin operations. Provides company CRUD for system admins
 *              and user management scoped to a company for both company admins and system admins.
 *              System admins have full access; company admins are restricted to their own company
 *              and cannot set the is_system_admin flag on users.
 *              Passwords are always hashed with bcrypt before being persisted.
 *              Mutations on company-scoped users are recorded in user_logs for audit purposes.
 * Authors: DebugStudio Team
 * Last Modification made:
 * 27/05/2026 [Julio Rodriguez] getAuditLogs now returns combined user_logs + request_logs for the company.
 */

import {
  BadRequestException,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, In, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Company } from 'src/companies/entity/company.entity';
import { User } from 'src/users/entities/user.entity';
import { CostCenter } from 'src/cost-centers/entity/cost-centers.entity';
import { Request as RequestEntity } from 'src/requests/entities/request.entity';
import { CreateCompanyDto, UpdateCompanyDto } from 'src/companies/dto/company.dtos';
import { CreateUserDto, UpdateUserDto } from 'src/users/dto/user.dtos';
import { CompanySetupDto, FindUsersQueryDto, SetCompanyAdminDto, SetUserFlagsDto, UpdateCompanySettingsDto } from './dto/admin.dto';
import { UserInfoInterface } from 'src/guards/interfaces/userInfo.interface';
import { UserLogsService } from 'src/user-logs/user-logs.service';
import { UserLogs } from 'src/user-logs/entity/user-logs.entity';
import { RequestLog } from 'src/request-logs/entities/request-log.entity';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(CostCenter)
    private readonly costCenterRepository: Repository<CostCenter>,

    @InjectRepository(RequestEntity)
    private readonly requestRepository: Repository<RequestEntity>,

    @InjectRepository(RequestLog)
    private readonly requestLogRepo: Repository<RequestLog>,

    private readonly userLogsService: UserLogsService,
  ) {}

  private async writeLog(idUser: string, ip: string, report: string): Promise<void> {
    await this.userLogsService.create({ id_user: idUser, ip, report });
  }

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
    ip: string,
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

    await this.writeLog(
      saved.id,
      ip,
      `USER_CREATED§${saved.email}§is_requester=${data.is_requester ?? true},is_approver=${data.is_approver ?? false},is_soi=${data.is_soi ?? false},is_travelAgent=${data.is_travelAgent ?? false}`,
    );

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
    ip: string,
  ): Promise<User> {
    const target = await this.findUserInCompany(companyId, userId);

    const data: UpdateUserDto = { ...dto };
    if (!caller.is_system_admin) {
      delete data.is_system_admin;
    }
    if (data.password) {
      data.password = await bcrypt.hash(data.password, 10);
    }

    const changedFields = Object.keys(dto).filter((k) => k !== 'password');
    await this.userRepository.update(userId, data);

    await this.writeLog(
      userId,
      ip,
      `USER_PROFILE_UPDATED§${target.email}§${changedFields.join(',')}`,
    );

    return this.findUserInCompany(companyId, userId);
  }

  /**
   * setUserFlags — Updates role flags for a user scoped to the given company.
   * Only modifies flags present in the dto; omitted flags are left unchanged.
   * Input: company id, user id, SetUserFlagsDto.
   * Output: updated User entity.
   */
  async setUserFlags(
    companyId: string,
    userId: string,
    dto: SetUserFlagsDto,
    caller: UserInfoInterface,
    ip: string,
  ): Promise<User> {
    const target = await this.findUserInCompany(companyId, userId);
    await this.userRepository.update(userId, dto);

    const flagStr = Object.entries(dto)
      .map(([k, v]) => `${k}=${String(v)}`)
      .join(',');
    await this.writeLog(
      userId,
      ip,
      `USER_FLAGS_UPDATED§${target.email}§${flagStr}`,
    );

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
    caller: UserInfoInterface,
    ip: string,
  ): Promise<{ status: boolean; message: string }> {
    const target = await this.findUserInCompany(companyId, userId);
    await this.writeLog(
      userId,
      ip,
      `USER_DELETED§${target.email}`,
    );
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

  /**
   * updateCompanySettings — Updates configurable policy settings for a company.
   * Only company admins can update their own company.
   * Input: companyId (string), dto (UpdateCompanySettingsDto), caller (UserInfoInterface).
   * Output: updated Company entity.
   */
  async updateCompanySettings(
    companyId: string,
    dto: UpdateCompanySettingsDto,
    caller: UserInfoInterface,
    ip: string,
  ): Promise<Company> {
    if (!caller.is_system_admin && caller.id_company !== companyId) {
      throw this.clientError(
        'Access restricted to your own company',
        'ADMIN_FORBIDDEN_COMPANY',
      );
    }
    await this.findOneCompany(companyId);
    await this.companyRepository.update(companyId, dto);

    const changedFields = Object.entries(dto)
      .map(([k, v]) => `${k}=${String(v)}`)
      .join(',');
    await this.writeLog(
      caller.id,
      ip,
      `SETTINGS_UPDATED§${changedFields}`,
    );

    return this.findOneCompany(companyId);
  }

  /**
   * getAuditLogs — Returns all audit log entries for users belonging to the given company.
   * Company admins can only access their own company. System admins access any.
   * Input: companyId (string), caller (UserInfoInterface).
   * Output: UserLogs array with user name and email populated.
   */
  /**
   * getCompanyRequests — Returns all requests belonging to a company.
   * Company admins can only access their own company. System admins access any.
   * Input: companyId (string), caller (UserInfoInterface).
   * Output: RequestEntity array with user (requester) populated, ordered newest first.
   */
  async getCompanyRequests(
    companyId: string,
    caller: UserInfoInterface,
  ): Promise<RequestEntity[]> {
    if (!caller.is_system_admin && caller.id_company !== companyId) {
      throw this.clientError('Access restricted to your own company', 'ADMIN_FORBIDDEN_COMPANY');
    }
    return this.requestRepository.find({
      where: { id_company: companyId },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  async getAuditLogs(companyId: string, caller: UserInfoInterface) {
    if (!caller.is_system_admin && caller.id_company !== companyId) {
      throw this.clientError('Access restricted to your own company', 'ADMIN_FORBIDDEN_COMPANY');
    }

    const [userLogs, companyRequests] = await Promise.all([
      this.userLogsService.findByCompany(companyId),
      this.requestRepository.find({
        where: { id_company: companyId },
        select: ['id'],
      }),
    ]);

    const requestIds = companyRequests.map((r) => r.id);
    const requestLogs: RequestLog[] = requestIds.length > 0
      ? await this.requestLogRepo.find({
          where: { id_request: In(requestIds) },
          relations: ['user'],
        })
      : [];

    const toIso = (d: Date | string): string =>
      d instanceof Date ? d.toISOString() : String(d);

    const combined = [
      ...userLogs.map((ul) => ({
        id: ul.id,
        id_user: ul.id_user,
        date: toIso(ul.date as unknown as Date | string),
        ip: ul.ip ?? null,
        report: ul.report ?? '',
        new_status: undefined as string | undefined,
        id_request: undefined as string | undefined,
        user: ul.user
          ? { name: ul.user.name, last_name: ul.user.last_name, email: ul.user.email }
          : undefined,
      })),
      ...requestLogs.map((rl) => ({
        id: rl.id,
        id_user: rl.id_user,
        date: toIso(rl.change_date as unknown as Date | string),
        ip: null as string | null,
        report: rl.report ?? '',
        new_status: rl.new_status,
        id_request: rl.id_request,
        user: rl.user
          ? { name: rl.user.name, last_name: rl.user.last_name, email: rl.user.email }
          : undefined,
      })),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return combined;
  }
}
