/**
 * role.decorator.ts
 * Description: Custom NestJS decorator that attaches required role names to a route
 * handler via metadata. Can be used with a roles guard to enforce role-based access control.
 * Authors: Original Monarca team
 * Last Modification made:
 * 25/02/2026 [Juan Pablo Narchi Capote] Added detailed comments and documentation for clarity and maintainability.
 */

import { SetMetadata } from '@nestjs/common';

/**
 * Roles, decorator that sets required role names as metadata on a route handler.
 * Input: ...roles (string[]) - one or more role names required to access the route.
 * Output: a method decorator that attaches the roles metadata.
 */
export const Roles = (...roles: string[]) => SetMetadata('roles', roles);
