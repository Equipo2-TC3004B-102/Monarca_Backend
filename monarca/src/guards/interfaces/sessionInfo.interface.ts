/**
 * sessionInfo.interface.ts
 * Description: Interface representing the decoded JWT session payload attached to the
 * request by AuthGuard. Contains the user's unique identifier extracted from the token.
 * Authors: Original Monarca team
 * Last Modification made:
 * 25/02/2026 [Juan Pablo Narchi Capote] Added detailed comments and documentation for clarity and maintainability.
 */

export interface SessionInfoInterface {
  id: string;
}
