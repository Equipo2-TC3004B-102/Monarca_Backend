/**
 * FileName: approval-engine.controller.ts
 * Description: Controller for the approval engine feature. Exposes HTTP endpoints
 *              for managing approval levels and actors.
 * Authors: DebugStudio Team
 * Last Modification: 
 * 21/04/2026 [Julio Rodríguez] Created approval engine controller scaffold
 */

import { Controller } from '@nestjs/common';
import { ApprovalEngineService } from './approval-engine.service';

@Controller('approval-engine')
export class ApprovalEngineController {
  constructor(private readonly approvalEngineService: ApprovalEngineService) {}
}