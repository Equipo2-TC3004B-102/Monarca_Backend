/**
 * FileName: userInfo.interface.ts
 * Description: Interface for defining the structure of user information.
 * Authors: Original Monarca team
 * Last Modification made:
 * 06/05/2026 [Julio Rodriguez] Deleted id_role — access control now handled exclusively via boolean flags.
 */

export interface UserInfoInterface {
  id: string;
  email: string;
  name: string;
  last_name: string;
  status: string;
  id_ceco: string | null;
  id_travel_agency: string | null;
  id_company: string | null;
  manager_id: string | null;
  is_system_admin?: boolean;
  is_first_login?: boolean;
  is_requester?: boolean;
  is_approver?: boolean;
  is_soi?: boolean;
  is_travelAgent?: boolean;
  is_company_admin?: boolean;
}
