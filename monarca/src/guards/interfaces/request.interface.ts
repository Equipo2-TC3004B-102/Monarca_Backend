/**
 * request.interface.ts
 * Description: Type definition that extends the native Request with custom properties
 * added by the authentication and permissions guards. Includes sessionInfo (decoded JWT
 * payload), userPermissions (array of permission names), and userInfo (full user details).
 * Authors: Original Monarca team
 * Last Modification made:
 * 25/02/2026 [Juan Pablo Narchi Capote] Added detailed comments and documentation for clarity and maintainability.
 */

import { SessionInfoInterface } from './sessionInfo.interface';
import { UserInfoInterface } from './userInfo.interface';

export type RequestInterface = Request & {
  sessionInfo: SessionInfoInterface;
  userPermissions?: string[];
  userInfo: UserInfoInterface;
};
