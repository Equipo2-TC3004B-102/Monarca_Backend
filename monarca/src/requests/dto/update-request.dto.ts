/**
 * update-request.dto.ts
 * Description: Data Transfer Object for updating a travel request. Extends CreateRequestDto
 * directly, requiring the same fields as creation (origin city, title, motive, advance money,
 * requirements, priority, and destinations).
 * Authors: Original Monarca team
 * Last Modification made:
 * 25/02/2026 [Juan Pablo Narchi Capote] Added detailed comments and documentation for clarity and maintainability.
 */

import { PartialType } from '@nestjs/swagger';
import { CreateRequestDto } from './create-request.dto';

export class UpdateRequestDto extends CreateRequestDto {}
