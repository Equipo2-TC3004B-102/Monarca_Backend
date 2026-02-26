/**
 * userInfo.interface.ts
 * Description: Interface representing the user's profile information attached to the
 * request by PermissionsGuard. Contains the user's ID, email, name, last name, status,
 * department ID, role ID, and optional travel agency ID.
 * Authors: Original Monarca team
 * Last Modification made:
 * 25/02/2026 [Juan Pablo Narchi Capote] Added detailed comments and documentation for clarity and maintainability.
 */

export interface UserInfoInterface {
  id: string;
  email: string;
  name: string;
  last_name: string;
  status: string;
  id_department: string;
  id_role: string;
  id_travel_agency: string | undefined;
}
