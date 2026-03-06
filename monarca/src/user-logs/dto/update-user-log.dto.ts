/**
 * FileName: update-user-log.dto.ts
 * Description: Data Transfer Object for updating a user log entry. Extends
 *              CreateUserLogDto making all fields optional via PartialType.
 * Authors: Original Monarca team
 * Last Modification made:
 * 25/02/2026 [Sergio Jiawei Xuan] Added detailed comments and documentation for clarity and maintainability.
 */

import { PartialType } from '@nestjs/swagger';
import { CreateUserLogDto } from './create-user-log.dto';

export class UpdateUserLogDto extends PartialType(CreateUserLogDto) {}
