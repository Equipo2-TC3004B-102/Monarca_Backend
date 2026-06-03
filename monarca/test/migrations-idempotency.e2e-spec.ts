/**
 * FileName: migrations-idempotency.e2e-spec.ts
 * Description: End-to-end tests for the Migration feature. Boots the full NestJS application
 *              and verifies that the migration scripts can be applied and reverted idempotently.
 * Authors: DebugStudio Team
 * Last Modification made:
 * 20/04/2026 [Santiago Coronado Hernández] Created file and implemented tests for up() and down() idempotency.
 */

import dataSource from 'src/data-source';
import { QueryRunner } from 'typeorm';

import { DatabaseV11776451915698 } from '../migrations/1776451915698-Database_v1';


describe('Migration idempotency', () => {
  const RUNS = 5;

  /**
   * beforeAll - Bootstraps the full NestJS application before any test runs.
   * Input: None
   * Output: Initializes the database connection using TypeORM's DataSource before running any migration tests.
   */
  beforeAll(async () => {
    if (!dataSource.isInitialized) {
      await dataSource.initialize();
    }
  });

  /**
   * afterAll - Closes the NestJS application after all tests have run.
   * Input: None
   * Output: Closes the database connection to release all resources after migration tests are completed.
   */
  afterAll(async () => {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  });

  /**
   * dropCurrencyColumns - Helper function to drop the currency-related columns from the requests table before testing up() idempotency.
   * Input: queryRunner - TypeORM QueryRunner instance to execute raw SQL queries.
   * Output: Executes SQL queries to drop the unconverted_advance_money, exchange_rate, and currency columns if they exist.
   */
  const dropCurrencyColumns = async (queryRunner: QueryRunner): Promise<void> => {
    await queryRunner.query(
      'ALTER TABLE "requests" DROP COLUMN IF EXISTS "unconverted_advance_money"',
    );
    await queryRunner.query(
      'ALTER TABLE "requests" DROP COLUMN IF EXISTS "exchange_rate"',
    );
    await queryRunner.query('ALTER TABLE "requests" DROP COLUMN IF EXISTS "currency"');
  };

  /**
   * up() should be idempotent - Verifies that running the up() migration multiple times does not cause errors and results in the expected database schema.
   * Input: None (the test itself runs the up() method multiple times)
   * Output: Passes if after multiple executions of up(), the requests table contains the expected columns without duplicates or errors.
   */
  it(`up() should be idempotent across ${RUNS} executions`, async () => {
    const queryRunner = dataSource.createQueryRunner();
    const migration = new DatabaseV11776451915698();

    try {
      await queryRunner.connect();

      await dropCurrencyColumns(queryRunner);

      for (let i = 0; i < RUNS; i += 1) {
        await migration.up(queryRunner);
      }

      const columns = await queryRunner.query(`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = 'requests'
          AND column_name IN ('currency', 'exchange_rate', 'unconverted_advance_money')
      `);

      const columnNames = columns
        .map((column: { column_name: string }) => column.column_name)
        .sort();

      expect(columnNames).toEqual([
        'currency',
        'exchange_rate',
        'unconverted_advance_money',
      ]);
    } finally {
      await queryRunner.release();
    }
  });
  
    /**
   * down() should be idempotent - Verifies that running the down() migration multiple times does not cause errors and results in the expected database schema.
   * Input: None (the test itself runs the down() method multiple times)
   * Output: Passes if after multiple executions of down(), the requests table does not contain the currency-related columns and no errors occur.
   */
  it(`down() should be idempotent across ${RUNS} executions`, async () => {
    const queryRunner = dataSource.createQueryRunner();
    const migration = new DatabaseV11776451915698();

    try {
      await queryRunner.connect();

      await migration.up(queryRunner);

      for (let i = 0; i < RUNS; i += 1) {
        await migration.down(queryRunner);
      }

      const columns = await queryRunner.query(`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = 'requests'
          AND column_name IN ('currency', 'exchange_rate', 'unconverted_advance_money')
      `);

      expect(columns).toHaveLength(0);
    } finally {
      await queryRunner.release();
    }
  });
});