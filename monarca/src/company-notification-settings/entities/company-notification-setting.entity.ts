/*
 * Filename: company-notification-setting.entity.ts
 * Description: Entity file for the company_notification_settings table, which stores notification preferences for each company.
 * Authors: DebugStudio team
 * Last Modification made: [04/05/2026] [Jinsik Yoon] Initial creation of the entity file.
 */

import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Company } from '../../companies/entity/company.entity';

@Entity('company_notification_settings')
export class CompanyNotificationSetting {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'id_company', type: 'uuid', unique: true })
  id_company: string;

  @OneToOne(() => Company)
  @JoinColumn({ name: 'id_company' })
  company: Company;

  @Column({ default: true })
  email_enabled: boolean;

  @Column({ default: true })
  in_app_enabled: boolean;
 
  @Column({ default: true })
  email_requests_created: boolean;

  @Column({ default: true })
  email_requests_status: boolean;

  @Column({ default: true })
  email_revisions: boolean;

  @Column({ default: true })
  email_reservations: boolean;

  @Column({ default: true })
  email_admin_alerts: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}