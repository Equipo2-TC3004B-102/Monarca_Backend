/**
 * permission.decorator.ts
 * Description: Custom NestJS decorator that attaches required permission names to a
 * route handler via metadata. Used in conjunction with PermissionsGuard to enforce
 * permission-based access control on endpoints.
 * Authors: Original Monarca team
 * Last Modification made:
 * 25/02/2026 [Juan Pablo Narchi Capote] Added detailed comments and documentation for clarity and maintainability.
 */

import { SetMetadata } from '@nestjs/common';

export const PERMISSIONS_KEY = 'permissions';

/**
 * Permissions, decorator that sets required permission names as metadata on a route handler.
 * Input: ...permissions (string[]) - one or more permission names required to access the route.
 * Output: a method decorator that attaches the permissions metadata.
 */
export const Permissions = (...permissions: string[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
