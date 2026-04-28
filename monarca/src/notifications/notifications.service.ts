/**
 * FileName: notifications.service.ts
 * Description: Service responsible for sending transactional emails via Nodemailer.
 *              Configures the SMTP transporter from environment variables and exposes
 *              methods for raw mail sending, structured notifications, and HTML-wrapped
 *              notifications. Each send attempt is automatically recorded in the
 *              notification_logs table via NotificationLogsService for full traceability.
 * Authors: Original Monarca team
 * Last Modification made:
 * 26/04/2026 [Juan Pablo Narchi] Integrated NotificationLogsService to auto-log every send attempt with status tracking.
 */

import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { NotificationLogsService } from './notification-logs.service';

@Injectable()
export class NotificationsService {
  private transporter: nodemailer.Transporter;

  constructor(private readonly logsService: NotificationLogsService) {
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
  }


  /**
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
  async notify(to: string, subject: string, message: string, html?: string) {
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
}
