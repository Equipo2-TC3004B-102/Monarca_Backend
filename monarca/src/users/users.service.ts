/**
 * FileName: users.service.ts
 * Description: Service handling user business logic. Provides CRUD operations
 *              against the users table. Throws BadRequestException when a user
 *              is not found by ID. Access control is flag-based — no role/permission
 *              relations are loaded.
 * Authors: Original Monarca team
 * Last Modification made:
 * 04/05/2026 [Julio Rodriguez] importUsers: role flags (is_requester, is_soi, is_travelAgent, is_approver) read from JSON; defaults to is_requester when no flag is set.
 */

import {
  BadRequestException,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { CostCenter } from 'src/cost-centers/entity/cost-centers.entity';
import { In, Repository } from 'typeorm';
import { CreateUserDto, UpdateUserDto, UserDto } from './dto/user.dtos';
import { ImportUserDto } from './dto/import-user.dto';
import { UserInfoInterface } from 'src/guards/interfaces/userInfo.interface';
import { UserLogsService } from 'src/user-logs/user-logs.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly repo: Repository<User>,
    @InjectRepository(CostCenter)
    private readonly cecoRepo: Repository<CostCenter>,
    private readonly userLogsService: UserLogsService,
  ) {}

  async findById(id: string): Promise<User> {
    const user = await this.repo.findOne({ where: { id } });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    return user;
  }

  async findAll(): Promise<UserDto[]> {
    return await this.repo.find();
  }

  // Added create, update and delete methods for user management
  async create(data: CreateUserDto): Promise<User> {
    const ent = this.repo.create({
      ...data,
      user_name: data.user_name ?? data.email.split('@')[0],
      creation_date: data.creation_date ?? new Date(),
    });

    return this.repo.save(ent);
  }

  async findOne(id: string): Promise<UserDto> {
    const ent = await this.repo.findOne({
      where: { id },
      relations: { travel_agency: true },
    });
    if (!ent) throw new BadRequestException(`User ${id} not found`);
    return ent;
  }

  async update(id: string, data: UpdateUserDto): Promise<UserDto> {
    await this.repo.update(id, data);

    return this.findOne(id);
  }

  async delete(id: string): Promise<{ status: boolean; message: string }> {
    await this.repo.delete(id);
    return { status: true, message: `User ${id} deleted` };
  }

  async importUsers(
    users: ImportUserDto[],
    callerCompanyId: string | null,
    caller: UserInfoInterface,
    ip: string,
  ): Promise<{ created: number; updated: number; errors: string[] }> {
    const errors: string[] = [];
    let created = 0;
    let updated = 0;
    let unchanged = 0;
    // Pass 0: upsert cost centers referenced in the JSON for the caller's company.
    // id_ceco in the JSON IS the primary key — create the row directly with that value.
    if (callerCompanyId) {
      const cecoIds = [
        ...new Set(users.map((u) => u.id_ceco).filter((n): n is string => !!n)),
      ];
      for (const cecoId of cecoIds) {
        const existingCeco = await this.cecoRepo.findOne({ where: { id: cecoId, id_company: callerCompanyId } });
        if (!existingCeco) {
          await this.cecoRepo.save(this.cecoRepo.create({ id: cecoId, name: cecoId, id_company: callerCompanyId }));
        }
      }
    }

    for (const userData of users) {
      try {
        // manager_id is an employee_num string — strip it from the DB spread.
        // id_ceco is the PK of cost_centers and can be assigned directly.
        const { manager_id: _managerEmployeeNum, ...userDataRest } = userData;

        // If there is no Employee number it uses the email to find the user, if there is an employee number it looks for both employee number and company id to avoid conflicts between companies with the same employee numbers.
        const existing = userData.employee_num && callerCompanyId
          ? await this.repo.findOne({ where: { employee_num: userData.employee_num, id_company: callerCompanyId } })
          : await this.repo.findOne({ where: { email: userData.email } });

        if (existing) {
          const updatePayload = {
            ...userDataRest,
            id_company: callerCompanyId ?? existing.id_company,
            user_name: userData.user_name ?? existing.user_name,
          };
          const hasChanges = Object.entries(updatePayload).some(
            ([key, value]) => value !== undefined && (existing as unknown as Record<string, unknown>)[key] !== value,
          );
          if (hasChanges) {
            await this.repo.update(existing.id, updatePayload);
            updated++;
          } else {
            unchanged++;
          }
        } else {
          const hashedPassword = await bcrypt.hash('password', 10);
          // Default to is_requester only when no role flag is explicitly provided in the JSON.
          const noFlagSet =
            userData.is_requester === undefined &&
            userData.is_approver === undefined &&
            userData.is_soi === undefined &&
            userData.is_travelAgent === undefined;
          const ent = this.repo.create({
            ...userDataRest,
            last_name: userData.last_name ?? '',
            password: hashedPassword,
            id_company: callerCompanyId,
            is_requester: userData.is_requester ?? noFlagSet,
            user_name: userData.user_name ?? userData.email.split('@')[0],
            creation_date: userData.creation_date ?? new Date(),
          });
          await this.repo.save(ent);
          created++;
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        errors.push(`${userData.email}: ${message}`);
      }
    }

    // Manager_id will be handdled by employee_nums, UUIDs scoped to callerCompanyId,
    // promote those users to approver, and update the manager_id FK on imported users.
    const managerEmployeeNums = [ // Filters the users that are in manager_id field and creates a unique list of employee numbers to look up their UUIDs later.
      ...new Set(users.filter((u) => u.manager_id).map((u) => u.manager_id as string)),
    ];

    // Creates a manager list for requests approvals
    if (managerEmployeeNums.length > 0) {
      const whereCondition = callerCompanyId // Company id for searching approvers in the same company.
        ? { employee_num: In(managerEmployeeNums), id_company: callerCompanyId }
        : { employee_num: In(managerEmployeeNums) };

      const managers = await this.repo.find({ // Creates the list of managers to be updated with approver permissions later.
        where: whereCondition,
        select: ['id', 'employee_num'],
      });

      const managerUUIDMap = new Map(managers.map((m) => [m.employee_num, m.id])); // Creates a map of employee_num to UUID for the managers found, to update the manager_id field on the imported users later.

      for (const manager of managers) {
        await this.repo.update(manager.id, { is_approver: true }); // Updates the manager users with approver permissions to allow them to approve requests.
      }

      // Updates the manager_id field on the imported users with the corresponding manager UUIDs found by employee_num.
      for (const userData of users.filter((u) => u.manager_id)) { // Gets 
        const managerUUID = managerUUIDMap.get(userData.manager_id!);
        if (!managerUUID) continue;

        const importedUser = 
          userData.employee_num && callerCompanyId
            ? await this.repo.findOne({
                where: { employee_num: userData.employee_num, id_company: callerCompanyId },
                select: ['id'],
              })
            : await this.repo.findOne({ where: { email: userData.email }, select: ['id'] });

        if (importedUser) {
          await this.repo.update(importedUser.id, { manager_id: managerUUID });
        }
      }
    }

    void this.userLogsService.create({
      id_user: caller.id,
      ip,
      report: `USERS_IMPORTED§${created}§${updated}§${unchanged}§${errors.length}`,
    });

    return { created, updated, errors };
  }
}
