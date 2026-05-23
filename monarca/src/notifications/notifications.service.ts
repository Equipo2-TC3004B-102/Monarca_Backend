/**
 * FileName: notifications.service.ts
 * Description: Service responsible for sending transactional emails via Nodemailer.
 *              Configures the SMTP transporter from environment variables and exposes
 *              methods for raw mail sending, structured notifications, and HTML-wrapped
 *              notifications. Each send attempt is automatically recorded in the
 *              notification_logs table via NotificationLogsService for full traceability.
 * Authors: Original Monarca team
 * Last Modification made:
 * 05/05/2026 [Santiago Coronado Hernández] Added notify method that wraps messages in a basic HTML template and checks company notification settings before sending.
 */

import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { NotificationLogsService } from './notification-logs.service';
import { CompanyNotificationSettingsService } from '../company-notification-settings/company-notification-settings.service';
import { NotificationType } from './notification-types';

@Injectable()
export class NotificationsService {
  private transporter: nodemailer.Transporter;

  constructor(
    private readonly logsService: NotificationLogsService,
    private readonly companySettingsService: CompanyNotificationSettingsService,
  ) {
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  /**
   * sendMail - Sends a raw email using the configured Nodemailer transporter.
   *            Creates a notification log entry before sending and updates it to
   *            SENT on success or FAILED with error details on failure.
   * Input: to (string) - recipient email address;
   *        subject (string) - email subject line;
   *        text (string) - plain-text body;
   *        html (string, optional) - HTML body to override plain text in capable clients.
   * Output: Promise<void>
   */
  async sendMail(to: string, subject: string, text: string, html?: string) {
    const log = await this.logsService.create(to, subject);

    const fromAddress = `"Sistema Monarca" <${process.env.EMAIL_USER}>`;
    try {
      await this.transporter.sendMail({ from: fromAddress, to, subject, text, html });
      await this.logsService.markSent(log.id);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown email error';
      await this.logsService.markFailed(log.id, errorMessage);
      console.error('Error enviando correo:', errorMessage);
    }
  }  /**
   * sendNotification - Convenience wrapper around sendMail for structured notification calls.
   * Input: to (string) - recipient email address;
   *        subject (string) - email subject line;
   *        text (string) - plain-text body;
   *        html (string, optional) - HTML body.
   * Output: Promise<void>
   */
  async sendNotification(to: string, subject: string, text: string, html?: string) {
    return this.sendMail(to, subject, text, html);
  }

  /**
   * notify - Sends an HTML-wrapped email notification. Escapes the message text to prevent
   *          XSS, then wraps the optional HTML partial inside a full HTML document before
   *          delegating to sendMail.
   * Input: to (string) - recipient email address;
   *        subject (string) - email subject line;
   *        message (string) - plain-text version of the notification body;
   *        html (string, optional) - inner HTML partial to embed in the full HTML wrapper.
   * Output: Promise<void>
   */
  async notify(
    to: string,
    subject: string,
    message: string,
    html?: string,
    options?: { companyId?: string; type?: NotificationType },
  ) {
    if (options?.companyId && options?.type) {
      const should = await this.shouldSendEmail(options.companyId, options.type);
      if (!should) {
        // Preference disables this notification type for the company — skip sending.
        return;
      }
    }
    const escapeHtml = (str: string) =>
      str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');

    const htmlComplete = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${escapeHtml(subject)}</title></head><body>${html ?? escapeHtml(message)}</body></html>`;
    return this.sendMail(to, subject, message, htmlComplete);
  }

  async shouldSendEmail(companyId: string, type: NotificationType): Promise<boolean> {
    try {
      const settings = await this.companySettingsService.getSettingsInternal(companyId);

      // If global email_enabled is false, do not send any emails.
      if (settings.email_enabled === false) return false;

      switch (type) {
        case NotificationType.REQUEST_CREATED:
          return settings.email_requests_created ?? true;
        case NotificationType.REQUEST_STATUS:
          return settings.email_requests_status ?? true;
        case NotificationType.REVISION_CREATED:
          return settings.email_revisions ?? true;
        case NotificationType.RESERVATION_CREATED:
          return settings.email_reservations ?? true;
        case NotificationType.ADMIN_ALERT:
          return settings.email_admin_alerts ?? true;
        default:
          return true;
      }
    } catch (err) {
      // On error, default to sending to avoid silent failures.
      console.error('Error checking company notification settings:', err);
      return true;
    }
  }
}
