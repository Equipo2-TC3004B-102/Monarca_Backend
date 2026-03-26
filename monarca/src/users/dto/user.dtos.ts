/**
 * FileName: user.dtos.ts
 * Description: Data Transfer Objects for user operations. Includes CreateUserDto
 *              with all required user fields, UpdateUserDto extending Create with
 *              all fields optional, and UserDto which omits the password field
 *              for safe responses.
 * Authors: Original Monarca team
 * Last Modification made:
 * 25/02/2026 [Sergio Jiawei Xuan] Added detailed comments and documentation for clarity and maintainability.
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

  @ApiProperty({ example: 1 })
  id_department?: string;

  @ApiProperty({ example: 2 })
  id_role: string;

  @ApiProperty()
  id_travel_agency?: string;
}

export class UpdateUserDto extends PartialType(CreateUserDto) {}

export class UserDto extends OmitType(User, ['password']) {}
