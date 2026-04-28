/**
 * FileName: data-source.ts
 * Description: Data source configuration for the Monarca application using TypeORM and PostgreSQL.
 * Authors: DebugStudio Team
 * Last Modification made:
 * 10/04/2026 [Santiago Coronado Hernández] Created File to enable Migrations
 */

import 'dotenv/config';
import { join } from 'path';
import { DataSource } from 'typeorm';

export default new DataSource({
  type: 'postgres',
  host: process.env.POSTGRES_HOST,
  port: process.env.POSTGRES_PORT ? parseInt(process.env.POSTGRES_PORT, 10) : 5433,
  username: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DATABASE,
  entities: [join(__dirname, '**', '*.entity{.ts,.js}')],
  migrations: [join(__dirname, '..', 'migrations', '*{.ts,.js}')],
  synchronize: false,
  logging: false,
});