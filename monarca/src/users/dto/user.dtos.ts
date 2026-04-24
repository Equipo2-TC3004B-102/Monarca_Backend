/**
 * FileName: user.dtos.ts
 * Description: Data Transfer Objects for user operations. Includes CreateUserDto
 *              with all required user fields, UpdateUserDto extending Create with
 *              all fields optional, and UserDto which omits the password field
 *              for safe responses.
 * Authors: Original Monarca team
 * Last Modification made:
 * 24/04/2026 [Julio Rodriguez] Standardized validators for Swagger.
 */

import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDate,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { User } from '../entities/user.entity';

export class CreateUserDto {
  @ApiProperty({ example: 'juan@gmail.com' })
  @IsString()
  email: string;

  @ApiProperty({ example: 'Juan' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'López' })
  @IsString()
  last_name: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  password: string;

  @ApiProperty({ example: 'active' })
  @IsString()
  status: string;

  @ApiProperty({ example: '8f28d424-2d93-483a-9018-f568cf6bc13a' })
  @IsUUID()
  id_role: string;

  @ApiProperty({ example: 'a1f4e0e1-1b89-4ccf-9e57-43f4b3d1a001', required: false })
  @IsUUID()
  @IsOptional()
  id_ceco?: string;

  @ApiProperty({ example: '24169971-6d7f-4bf7-982c-dad1aebac579', required: false })
  @IsUUID()
  @IsOptional()
  id_travel_agency?: string;

  @ApiProperty({ example: '11111111-1111-4111-8111-111111111111', required: false })
  @IsUUID()
  @IsOptional()
  id_company?: string;

  @ApiProperty({ example: '5781a1d8-f9f7-4561-b2ed-f6117877459f', required: false })
  @IsUUID()
  @IsOptional()
  manager_id?: string;

  @ApiProperty({ example: 'EMP-001', required: false })
  @IsString()
  @IsOptional()
  employee_num?: string;

  @ApiProperty({ example: 'jrodriguez', required: false })
  @IsString()
  @IsOptional()
  user_name?: string;

  @ApiProperty({ example: 'local', required: false })
  @IsString()
  @IsOptional()
  provider?: string;

  @ApiProperty({ required: false })
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  creation_date?: Date;

  @ApiProperty({ required: false, default: false })
  @IsBoolean()
  @IsOptional()
  is_system_admin?: boolean;

  @ApiProperty({ required: false, default: false })
  @IsBoolean()
  @IsOptional()
  is_company_admin?: boolean;

  @ApiProperty({ required: false, default: true })
  @IsBoolean()
  @IsOptional()
  is_first_login?: boolean;

  @ApiProperty({ required: false, default: true })
  @IsBoolean()
  @IsOptional()
  is_requester?: boolean;

  @ApiProperty({ required: false, default: false })
  @IsBoolean()
  @IsOptional()
  is_approver?: boolean;

  @ApiProperty({ required: false, default: false })
  @IsBoolean()
  @IsOptional()
  is_soi?: boolean;

  @ApiProperty({ required: false, default: false })
  @IsBoolean()
  @IsOptional()
  is_travelAgent?: boolean;

  @ApiProperty({ required: false })
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  first_login_at?: Date;

  @ApiProperty({ required: false })
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  last_login_at?: Date;
}

export class UpdateUserDto extends PartialType(CreateUserDto) {}

export class UserDto extends OmitType(User, ['password']) {}
