/**
 * FileName: update-cost-center.dto.ts
 * Description: Data transfer object for updating an existing cost center.
 * Authors: DebugStudio Team
 * Last Modification made:
 * 17/05/2026 [Santiago Coronado Hernández and Juan Pablo Narchi] Created DTO for cost center updates.
 */


import { PartialType } from '@nestjs/swagger';
import { CreateCostCenterDto } from './create-cost-center.dto';

export class UpdateCostCenterDto extends PartialType(CreateCostCenterDto) {}
