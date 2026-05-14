/**
 * FileName: admin.controller.ts
 * Description: Controller for admin endpoints. Exposes company CRUD (system admin only)
 *              and company-scoped user management (company admin + system admin).
 *              Class-level guard chain: AuthGuard → PermissionsGuard → CompanyAdminGuard.
 *              System-admin-only routes add SystemAdminGuard at the method level, which
 *              runs in addition to the class-level guards and restricts those endpoints
 *              to system admins exclusively.
 * Authors: DebugStudio Team
 * Last Modification:
 * 13/05/2026 [Julio Rodriguez] Added GET /admin/companies/:companyId/cost-centers endpoint.
 *                              Added GET /admin/companies/:companyId/info endpoint (company admin + system admin).
 */

import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { AuthGuard } from 'src/guards/auth.guard';
import { PermissionsGuard } from 'src/guards/permissions.guard';
import { CompanyAdminGuard } from 'src/guards/company-admin.guard';
import { SystemAdminGuard } from 'src/guards/system-admin.guard';
import { RequestInterface } from 'src/guards/interfaces/request.interface';
import { CreateCompanyDto, UpdateCompanyDto } from 'src/companies/dto/company.dtos';
import { CreateUserDto, UpdateUserDto } from 'src/users/dto/user.dtos';
import { CompanySetupDto, FindUsersQueryDto, SetCompanyAdminDto, SetUserFlagsDto } from './dto/admin.dto';

@UseGuards(AuthGuard, PermissionsGuard, CompanyAdminGuard)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // Companies (system admin)

  /**
   * setupCompany — Creates a company and its initial company admin user. System admin only.
   * Input: body with CompanySetupDto (company fields + admin user fields).
   * Output: created company and admin user without password.
   */
  @Post('companies/setup')
  @HttpCode(200)
  @UseGuards(SystemAdminGuard)
  async setupCompany(@Body() dto: CompanySetupDto) {
    return this.adminService.setupCompany(dto);
  }

  /**
   * createCompany — Creates a new company. System admin only.
   * Input: body with CreateCompanyDto.
   * Output: created Company entity.
   */
  @Post('companies')
  @HttpCode(200)
  @UseGuards(SystemAdminGuard)
  async createCompany(@Body() dto: CreateCompanyDto) {
    return this.adminService.createCompany(dto);
  }

  /**
   * findAllCompanies — Returns all companies. System admin only.
   * Input: none.
   * Output: Company array.
   */
  @Get('companies')
  @UseGuards(SystemAdminGuard)
  async findAllCompanies() {
    return this.adminService.findAllCompanies();
  }

  /**
   * findOneCompany — Returns one company by id. System admin only.
   * Input: id path param (uuid).
   * Output: Company entity.
   */
  @Get('companies/:id')
  @UseGuards(SystemAdminGuard)
  async findOneCompany(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.adminService.findOneCompany(id);
  }

  /**
   * updateCompany — Updates an existing company by id. System admin only.
   * Input: id path param (uuid), body with UpdateCompanyDto.
   * Output: updated Company entity.
   */
  @Patch('companies/:id')
  @UseGuards(SystemAdminGuard)
  async updateCompany(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateCompanyDto,
  ) {
    return this.adminService.updateCompany(id, dto);
  }

  /**
   * removeCompany — Deletes a company by id. System admin only.
   * Input: id path param (uuid).
   * Output: deletion confirmation.
   */
  @Delete('companies/:id')
  @UseGuards(SystemAdminGuard)
  async removeCompany(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.adminService.removeCompany(id);
  }

  // Company-scoped user management (company admin and system admin)

  /**
   * getCompanyInfo — Returns basic company info for the given company.
   * Company admins can only access their own company. System admins access any.
   * Input: companyId path param (uuid).
   * Output: Company entity.
   */
  @Get('companies/:companyId/info')
  async getCompanyInfo(
    @Param('companyId', new ParseUUIDPipe()) companyId: string,
    @Req() req: RequestInterface,
  ) {
    return this.adminService.getCompanyInfo(companyId, req.userInfo);
  }

  /**
   * getCostCentersByCompany — Returns all cost centers belonging to a company.
   * Company admins can only access their own company. System admins access any.
   * Input: companyId path param (uuid).
   * Output: CostCenter array.
   */
  @Get('companies/:companyId/cost-centers')
  async getCostCentersByCompany(
    @Param('companyId', new ParseUUIDPipe()) companyId: string,
    @Req() req: RequestInterface,
  ) {
    return this.adminService.getCostCentersByCompany(companyId, req.userInfo);
  }

  /**
   * findUsersByCompany — Returns users belonging to a company with optional filters.
   * Company admins can only access their own company. System admins access any.
   * Input: companyId path param (uuid), optional query filters.
   * Output: User array.
   */
  @Get('companies/:companyId/users')
  async findUsersByCompany(
    @Param('companyId', new ParseUUIDPipe()) companyId: string,
    @Query() query: FindUsersQueryDto,
  ) {
    return this.adminService.findUsersByCompany(companyId, query);
  }

  /**
   * createUserInCompany — Creates a new user in a company.
   * Scopes id_company to companyId; strips is_system_admin for company admins.
   * Input: companyId path param (uuid), body with CreateUserDto.
   * Output: created User without the password field.
   */
  @Post('companies/:companyId/users')
  @HttpCode(200)
  async createUserInCompany(
    @Param('companyId', new ParseUUIDPipe()) companyId: string,
    @Body() dto: CreateUserDto,
    @Req() req: RequestInterface,
  ) {
    return this.adminService.createUserInCompany(companyId, dto, req.userInfo);
  }

  /**
   * findUserInCompany — Returns one user from a company by id.
   * Input: companyId and userId path params (uuid).
   * Output: User entity.
   */
  @Get('companies/:companyId/users/:userId')
  async findUserInCompany(
    @Param('companyId', new ParseUUIDPipe()) companyId: string,
    @Param('userId', new ParseUUIDPipe()) userId: string,
  ) {
    return this.adminService.findUserInCompany(companyId, userId);
  }

  /**
   * updateUserInCompany — Updates a user in a company.
   * Strips is_system_admin from dto if the caller is not a system admin.
   * Input: companyId, userId path params (uuid), body with UpdateUserDto.
   * Output: updated User entity.
   */
  @Patch('companies/:companyId/users/:userId')
  async updateUserInCompany(
    @Param('companyId', new ParseUUIDPipe()) companyId: string,
    @Param('userId', new ParseUUIDPipe()) userId: string,
    @Body() dto: UpdateUserDto,
    @Req() req: RequestInterface,
  ) {
    return this.adminService.updateUserInCompany(companyId, userId, dto, req.userInfo);
  }

  /**
   * setUserFlags — Updates role flags for a user in a company.
   * Input: companyId, userId path params (uuid), body with SetUserFlagsDto.
   * Output: updated User entity.
   */
  @Patch('companies/:companyId/users/:userId/flags')
  async setUserFlags(
    @Param('companyId', new ParseUUIDPipe()) companyId: string,
    @Param('userId', new ParseUUIDPipe()) userId: string,
    @Body() dto: SetUserFlagsDto,
  ) {
    return this.adminService.setUserFlags(companyId, userId, dto);
  }

  /**
   * removeUserFromCompany — Deletes a user from a company.
   * Input: companyId, userId path params (uuid).
   * Output: deletion confirmation.
   */
  @Delete('companies/:companyId/users/:userId')
  async removeUserFromCompany(
    @Param('companyId', new ParseUUIDPipe()) companyId: string,
    @Param('userId', new ParseUUIDPipe()) userId: string,
  ) {
    return this.adminService.removeUserFromCompany(companyId, userId);
  }

  // Global user management (system admin)

  /**
   * findAllUsers — Returns users visible to the caller.
   * System admins see all users; company admins see only their own company's users.
   * Supports optional filters: name, email, employee_num.
   * Input: optional query params.
   * Output: User array.
   */
  @Get('users')
  async findAllUsers(@Query() query: FindUsersQueryDto, @Req() req: RequestInterface) {
    return this.adminService.findAllUsers(query, req.userInfo);
  }

  /**
   * findOneUser — Returns one user by id. System admin only.
   * Input: id path param (uuid).
   * Output: User entity.
   */
  @Get('users/:id')
  @UseGuards(SystemAdminGuard)
  async findOneUser(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.adminService.findOneUser(id);
  }

  /**
   * updateUser — Updates a user by id. System admin only.
   * Input: id path param (uuid), body with UpdateUserDto.
   * Output: updated User entity.
   */
  @Patch('users/:id')
  @UseGuards(SystemAdminGuard)
  async updateUser(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateUserDto,
  ) {
    return this.adminService.updateUser(id, dto);
  }

  /**
   * setCompanyAdmin — Assigns or revokes the is_company_admin flag. System admin only.
   * Input: id path param (uuid), body with SetCompanyAdminDto.
   * Output: updated User entity.
   */
  @Patch('users/:id/company-admin')
  @UseGuards(SystemAdminGuard)
  async setCompanyAdmin(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: SetCompanyAdminDto,
  ) {
    return this.adminService.setCompanyAdmin(id, dto);
  }
}