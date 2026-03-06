/**
 * FileName: login.dto.ts
 * Description: Data Transfer Object for login requests. Validates that email and
 *              password are strings, with email length between 5 and 30 characters.
 * Authors: Original Monarca team
 * Last Modification made:
 * 25/02/2026 [Sergio Jiawei Xuan] Added detailed comments and documentation for clarity and maintainability.
 */

import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, MaxLength } from 'class-validator';

export class LogInDTO {
  @ApiProperty({ example: 'juan@gmail.com' })
  @IsString()
  @MinLength(5)
  @MaxLength(30)
  email: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  password: string;
}
