export class CreateApprovalRuleDto {
  code: string;
  name: string;
  company_id: string;
  description?: string;
  applies_to?: string;
  level_order: number;
  min_amount_mon?: number;
  max_amount_mon?: number;
  required_approvals?: number;
  escalation_hours?: number;
  is_active?: boolean;
}
