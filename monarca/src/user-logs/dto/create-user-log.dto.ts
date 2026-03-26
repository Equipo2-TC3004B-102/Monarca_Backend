/**
 * FileName: create-user-log.dto.ts
 * Description: Data Transfer Object for creating a user log entry. Contains
 *              id_user, date, ip address and a report description.
 * Authors: Original Monarca team
 * Last Modification made:
 * 25/02/2026 [Sergio Jiawei Xuan] Added detailed comments and documentation for clarity and maintainability.
 */

import { ApiProperty } from '@nestjs/swagger';

export class CreateUserLogDto {
  @ApiProperty({ example: 1 })
  id_user: number;

  @ApiProperty({ example: '2023-12-01T10:00:00Z' })
  date: Date;

  @ApiProperty({ example: '192.168.1.1' })
  ip: string;

  @ApiProperty({ example: 'User accessed the dashboard' })
  report: string;
}
