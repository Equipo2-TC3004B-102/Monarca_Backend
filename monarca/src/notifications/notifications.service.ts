import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import * as Handlebars from 'handlebars';
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

  async sendMail(to: string, subject: string, text: string, html?: string) {
    const log = await this.logsService.create(to, subject);

    const fromAddress = `"Sistema Monarca" <${process.env.EMAIL_USER}>`;
    try {
      await this.transporter.sendMail({ from: fromAddress, to, subject, text, html });
      await this.logsService.markSent(log.id);
    } catch (error) {
      await this.logsService.markFailed(log.id, error.message);
      console.error('Error enviando correo:', error.message);
    }
  }

  async sendNotification(to: string, subject: string, text: string, html?: string) {
    return this.sendMail(to, subject, text, html);
  }

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
