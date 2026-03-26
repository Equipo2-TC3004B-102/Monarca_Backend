/**
 * FileName: update-voucher-dto
 * Description: Data Transfer Object for updating an existing voucher. Extends
 *              CreateVoucherDto via PartialType, making all fields optional so
 *              only provided fields are updated.
 * Authors: Original Moncarca team
 * Last Modification made:
 * 25/02/2026 [Diego de la Vega] Added detailed comments and documentation for clarity and maintainability.
 */

import { CreateVoucherDto } from './create-voucher-dto';
import { PartialType } from '@nestjs/swagger';

export class UpdateVoucherDto extends PartialType(CreateVoucherDto) {}
