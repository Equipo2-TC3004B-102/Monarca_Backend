/**
 * FileName: update-request-log.dto.ts
 * Description: Data Transfer Object for updating a request log entry. Extends
 *              CreateRequestLogDto making all fields optional via PartialType.
 * Authors: Original Monarca team
 * Last Modification made:
 * 25/02/2026 [Sergio Jiawei Xuan] Added detailed comments and documentation for clarity and maintainability.
 */

import { PartialType } from '@nestjs/swagger';
import { CreateRequestLogDto } from './create-request-log.dto';

export class UpdateRequestLogDto extends PartialType(CreateRequestLogDto) {}
