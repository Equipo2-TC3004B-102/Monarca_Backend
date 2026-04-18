import { Entity, PrimaryGeneratedColumn, Column, Index } from 'typeorm';

@Entity({ name: 'exchange_rates' })
@Index('idx_exchange_rates_currency_date', ['currency', 'updateDate'])
export class ExchangeRate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 3 })
  currency: string;

  @Column({ type: 'decimal', precision: 19, scale: 6, name: 'exchange_rate' })
  exchange_rate: number;

  @Column({
    type: 'date',
    name: 'update_date',
    default: () => 'CURRENT_DATE',
  })
  updateDate: Date;
}
