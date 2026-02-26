/**
 * permissions.helper.ts
 * Description: Utility functions for checking user permissions on request objects.
 * Centralizes permission verification logic to keep code clean, reusable, and scalable
 * as the number of routes and permissions grows.
 * Authors: Original Monarca team
 * Last Modification made:
 * 25/02/2026 [Juan Pablo Narchi Capote] Added detailed comments and documentation for clarity and maintainability.
 */

/**
 * hasPermission, checks if the user has a specific permission.
 * Input: req (any) - the request object with userPermissions array,
 *        permissionName (string) - the name of the permission to check.
 * Output: boolean - true if the user has the specified permission, false otherwise.
 */
export function hasPermission(req: any, permissionName: string): boolean {
  return req.userPermissions?.includes(permissionName) || false;
}

/**
 * hasAnyPermission, checks if the user has at least one of the provided permissions.
 * Input: req (any) - the request object with userPermissions array,
 *        permissionNames (string[]) - array of permission names to check.
 * Output: boolean - true if the user has at least one of the specified permissions, false otherwise.
 */
export function hasAnyPermission(req: any, permissionNames: string[]): boolean {
  if (!req.userPermissions) return false;
  return permissionNames.some((perm) => req.userPermissions.includes(perm));
}

/**
 * hasAllPermissions, checks if the user has all of the provided permissions.
 * Input: req (any) - the request object with userPermissions array,
 *        permissionNames (string[]) - array of permission names to check.
 * Output: boolean - true if the user has all of the specified permissions, false otherwise.
 */
export function hasAllPermissions(
  req: any,
  permissionNames: string[],
): boolean {
  if (!req.userPermissions) return false;
  return permissionNames.every((perm) => req.userPermissions.includes(perm));
}

/**
 * lacksPermission, checks if the user does NOT have a specific permission.
 * Input: req (any) - the request object with userPermissions array,
 *        permissionName (string) - the name of the permission to check.
 * Output: boolean - true if the user lacks the specified permission, false if they have it.
 */
export function lacksPermission(req: any, permissionName: string): boolean {
  return !hasPermission(req, permissionName);
}
