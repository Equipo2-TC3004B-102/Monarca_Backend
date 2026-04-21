/**
 * FileName: user.dtos.ts
 * Description: Data Transfer Objects for user operations. Includes CreateUserDto
 *              with all required user fields, UpdateUserDto extending Create with
 *              all fields optional, and UserDto which omits the password field
 *              for safe responses.
 * Authors: Original Monarca team
 * Last Modification made:
 * 16/02/2026 [Julio Rodriguez] Added new fields required by Ditta Consulting.
 */

import { ApiProperty, PartialType } from '@nestjs/swagger';
import { OmitType } from '@nestjs/swagger';
import { User } from '../entities/user.entity';

export class CreateUserDto {
  @ApiProperty({ example: 'juan@gmail.com' })
  email: string;

  @ApiProperty({ example: 'Juan' })
  name: string;

  @ApiProperty({ example: 'López' })
  last_name: string;

  @ApiProperty({ example: '123456' })
  password: string;

  @ApiProperty({ example: 'active' })
  status: string;

  @ApiProperty({ example: 1, required: false })
  id_ceco?: string;

  @ApiProperty({ example: 2 })
  id_role: string;

  @ApiProperty()
  id_travel_agency: string;

  @ApiProperty({ required: false })
  employee_num: string;

  @ApiProperty({ required: false })
  user_name: string;

  @ApiProperty({ required: false })
  creation_date: Date;

  @ApiProperty({ required: false })
  id_company: string;

  @ApiProperty({ required: false })
  provider: string;

  @ApiProperty({ required: false })
  manager_id: string;

  @ApiProperty({ required: false, default: false })
  is_system_admin: boolean;

  @ApiProperty({ required: false, default: true })
  is_first_login: boolean;

  @ApiProperty({ required: false, default: true })
  is_requester: boolean;

  @ApiProperty({ required: false, default: false })
  is_approver: boolean;

  @ApiProperty({ required: false, default: false })
  is_soi: boolean;

  @ApiProperty({ required: false, default: false })
  is_travelAgent: boolean;

  @ApiProperty({ required: false })
  first_login_at: Date;

  @ApiProperty({ required: false })
  last_login_at: Date;
}

export class UpdateUserDto extends PartialType(CreateUserDto) {}

export class UserDto extends OmitType(User, ['password']) {}
