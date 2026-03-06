/**
 * FileName: update-destination.dto.ts
 * Description: Data Transfer Object for updating a destination. Extends
 *              CreateDestinationDto making all fields optional via PartialType.
 * Authors: Original Monarca team
 * Last Modification made:
 * 25/02/2026 [Sergio Jiawei Xuan] Added detailed comments and documentation for clarity and maintainability.
 */

import { PartialType } from '@nestjs/swagger';
import { CreateDestinationDto } from './create-destination.dto';

export class UpdateDestinationDto extends PartialType(CreateDestinationDto) {}
