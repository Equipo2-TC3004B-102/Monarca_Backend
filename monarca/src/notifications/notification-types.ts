/**
 * FileName: notification-types.ts
 * Description: Enum for defining different types of notifications.
 * Authors: Original Monarca team
 * Last Modification made:
 * 05/05/2026 [Santiago Coronado Hernández] Added the NotificationType enum to centralize notification type definitions and improve code maintainability.
 */

export enum NotificationType {
  REQUEST_CREATED = 'REQUEST_CREATED',
  REQUEST_STATUS = 'REQUEST_STATUS',
  REVISION_CREATED = 'REVISION_CREATED',
  RESERVATION_CREATED = 'RESERVATION_CREATED',
  ADMIN_ALERT = 'ADMIN_ALERT',
}
