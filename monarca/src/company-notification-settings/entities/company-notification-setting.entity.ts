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

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}