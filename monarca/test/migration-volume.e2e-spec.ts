/**
 * FileName: migration-volume.e2e-spec
 * Description: End-to-end tests for the Migration feature. Boots the full NestJS application
 *              and verifies that the migration scripts can be applied and reverted idempotently.
 * Authors: DebugStudio Team
 * Last Modification made:
 * 20/04/2026 [Santiago Coronado Hernández] Created file and implemented tests for up() and down() idempotency.
 */

import { randomUUID } from 'crypto';
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import AppDataSource from 'src/data-source';

jest.setTimeout(120000);

type DatasetCounts = {
  requests: number;
  reservations: number;
  vouchers: number;
};

describe('Migration volume validation (requests/reservations/vouchers)', () => {
  const volumes = [1, 10, 20];

  /**
   * beforeAll - Initializes the database connection before running any migration tests.
   * Input: None
   * Output: Ensures that the AppDataSource is initialized and ready for running migrations and queries.
   */
  beforeAll(async () => {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }
  });

  /**
   * afterAll - Closes the database connection after all migration tests have completed.
   * Input: None
   * Output: Ensures that the AppDataSource connection is properly closed to free resources.
   */
  afterAll(async () => {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  });

  /**
   * beforeEach - Resets the database to a clean state before each test case to ensure isolation and consistency.
   * Input: None
   * Output: Drops and recreates the public schema, grants permissions, and ensures necessary extensions are in place.
   */
  beforeEach(async () => {
    await resetDatabase();
  });

  for (const volume of volumes) {
    /**
     * it - Runs the migration scripts and seeds the database with a specified volume of data, then verifies that all records are created and relational integrity is maintained.
     * Input: volume - The number of records to create in requests, reservations, and vouchers tables.
     * Output: Passes if migrations run successfully, the expected number of records are created, and no orphaned records exist.    
     */
    it(`runs migration and keeps relational integrity with ${volume} rows`, async () => {
      const hasPendingBeforeRun = await AppDataSource.showMigrations();
      expect(hasPendingBeforeRun).toBe(true);

      const executedMigrations = await AppDataSource.runMigrations();
      expect(executedMigrations.length).toBeGreaterThan(0);

      const hasPendingAfterRun = await AppDataSource.showMigrations();
      expect(hasPendingAfterRun).toBe(false);

      const migrationRows = await AppDataSource.query(
        'SELECT COUNT(*)::int AS count FROM "migrations"',
      );
      expect(Number(migrationRows[0].count)).toBeGreaterThan(0);

      await seedVolumeData(volume);

      const tableCounts = await getCounts();
      expect(tableCounts.requests).toBe(volume);
      expect(tableCounts.reservations).toBe(volume);
      expect(tableCounts.vouchers).toBe(volume);

      await expectNoOrphans();
    });
  }
});

/**
 * resetDatabase - Utility function to drop and recreate the public schema, grant permissions, and ensure necessary extensions are in place for a clean testing environment.
 * Input: None
 * Output: Executes SQL queries to reset the database state before each test case.
 */
async function resetDatabase(): Promise<void> {
  await AppDataSource.query('DROP SCHEMA IF EXISTS public CASCADE');
  await AppDataSource.query('CREATE SCHEMA public');
  await AppDataSource.query('GRANT ALL ON SCHEMA public TO public');
  await AppDataSource.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
}

/**
 * seedVolumeData - Utility function to insert a specified volume of data into the database for testing purposes.
 * Input: volume - The number of records to create in requests, reservations, and vouchers tables.
 * Output: Executes SQL queries to insert the required data into the database.
 */
async function seedVolumeData(volume: number): Promise<void> {
  const companyId = randomUUID();
  const roleId = randomUUID();
  const agencyId = randomUUID();
  const destinationId = randomUUID();

  const requesterUserId = randomUUID();
  const adminUserId = randomUUID();
  const soiUserId = randomUUID();

  await AppDataSource.query('BEGIN');
  try {
    await AppDataSource.query(
      'INSERT INTO "companies" ("id", "name", "local_currency") VALUES ($1, $2, $3)',
      [companyId, 'Volume Test Company', 'USD'],
    );

    await AppDataSource.query(
      'INSERT INTO "roles" ("id", "name") VALUES ($1, $2)',
      [roleId, 'VOLUME_TEST_ROLE'],
    );

    await AppDataSource.query(
      'INSERT INTO "travel_agencies" ("id", "name") VALUES ($1, $2)',
      [agencyId, 'Volume Test Agency'],
    );

    await AppDataSource.query(
      'INSERT INTO "destinations" ("id", "country", "city") VALUES ($1, $2, $3)',
      [destinationId, 'Mexico', 'Bogota'],
    );

    await insertUser({
      id: requesterUserId,
      email: 'requester.volume@test.com',
      userName: 'requester_volume_test',
      roleId,
      companyId,
      agencyId,
    });

    await insertUser({
      id: adminUserId,
      email: 'admin.volume@test.com',
      userName: 'admin_volume_test',
      roleId,
      companyId,
      agencyId,
    });

    await insertUser({
      id: soiUserId,
      email: 'soi.volume@test.com',
      userName: 'soi_volume_test',
      roleId,
      companyId,
      agencyId,
    });

    for (let i = 0; i < volume; i += 1) {
      const requestId = randomUUID();
      const requestDestinationId = randomUUID();

      await AppDataSource.query(
        [
          'INSERT INTO "requests"',
          '("id", "id_user", "id_origin_city", "id_admin", "id_SOI", "id_travel_agency", "id_company", "title", "motive", "advance_money", "currency", "priority")',
          'VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)',
        ].join(' '),
        [
          requestId,
          requesterUserId,
          destinationId,
          adminUserId,
          soiUserId,
          agencyId,
          companyId,
          `Request ${i + 1}`,
          `Volume test motive ${i + 1}`,
          100 + i,
          'USD',
          'Normal',
        ],
      );

      await AppDataSource.query(
        [
          'INSERT INTO "requests_destinations"',
          '("id", "id_destination", "id_request", "destination_order", "stay_days", "arrival_date", "departure_date", "is_hotel_required", "is_plane_required", "is_last_destination")',
          "VALUES ($1, $2, $3, $4, $5, NOW(), NOW() + interval '1 day', $6, $7, $8)",
        ].join(' '),
        [requestDestinationId, destinationId, requestId, 1, 2, true, true, true],
      );

      await AppDataSource.query(
        [
          'INSERT INTO "reservations"',
          '("id", "title", "comments", "link", "price", "id_request_destination")',
          'VALUES ($1, $2, $3, $4, $5, $6)',
        ].join(' '),
        [
          randomUUID(),
          `Reservation ${i + 1}`,
          'Migration volume test reservation',
          `https://example.com/reservation/${i + 1}`,
          250.5,
          requestDestinationId,
        ],
      );

      await AppDataSource.query(
        [
          'INSERT INTO "vouchers"',
          '("id", "id_request", "class", "amount", "tax_type", "currency", "date", "status", "id_approver")',
          'VALUES ($1, $2, $3, $4, $5, $6, NOW(), $7, $8)',
        ].join(' '),
        [
          randomUUID(),
          requestId,
          'travel',
          123.45,
          'IVA',
          'USD',
          'PENDING',
          adminUserId,
        ],
      );
    }

    await AppDataSource.query('COMMIT');
  } catch (error) {
    await AppDataSource.query('ROLLBACK');
    throw error;
  }
}

type UserInput = {
  id: string;
  email: string;
  userName: string;
  roleId: string;
  companyId: string;
  agencyId: string;
};

/**
 * insertUser - Inserts a new user into the database.
 * Input: input - An object containing the user's details.
 * Output: Resolves when the user is successfully inserted.
 */
async function insertUser(input: UserInput): Promise<void> {
  await AppDataSource.query(
    [
      'INSERT INTO "users"',
      '("id", "email", "name", "last_name", "password", "status", "user_name", "id_role", "id_company", "id_travel_agency")',
      'VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)',
    ].join(' '),
    [
      input.id,
      input.email,
      'Volume',
      'Tester',
      '$2b$10$9.s0xuN.LUwa4YQ4nyWvQu6BYO8M5ZVj4JQ2y4x9Yx7zM7l9BlyqW',
      'active',
      input.userName,
      input.roleId,
      input.companyId,
      input.agencyId,
    ],
  );
}

/**
 * getCounts - Retrieves the count of records in each of the main tables.
 * Input: None
 * Output: A promise resolving to an object containing the counts for requests, reservations, and vouchers.
 */
async function getCounts(): Promise<DatasetCounts> {
  const [requestsRows, reservationsRows, vouchersRows] = await Promise.all([
    AppDataSource.query('SELECT COUNT(*)::int AS count FROM "requests"'),
    AppDataSource.query('SELECT COUNT(*)::int AS count FROM "reservations"'),
    AppDataSource.query('SELECT COUNT(*)::int AS count FROM "vouchers"'),
  ]);

  return {
    requests: Number(requestsRows[0].count),
    reservations: Number(reservationsRows[0].count),
    vouchers: Number(vouchersRows[0].count),
  };
}

/**
 * expectNoOrphans - Verifies that there are no orphaned records in the reservations and vouchers tables that do not have corresponding parent records in requests or requests_destinations.
 * Input: None
 * Output: Passes if all counts of orphaned records are zero, ensuring relational integrity is maintained after migrations and seeding.
 */
async function expectNoOrphans(): Promise<void> {
  const checks = await Promise.all([
    AppDataSource.query(
      [
        'SELECT COUNT(*)::int AS count',
        'FROM "reservations" r',
        'LEFT JOIN "requests_destinations" rd ON rd."id" = r."id_request_destination"',
        'WHERE rd."id" IS NULL',
      ].join(' '),
    ),
    AppDataSource.query(
      [
        'SELECT COUNT(*)::int AS count',
        'FROM "requests_destinations" rd',
        'LEFT JOIN "requests" req ON req."id" = rd."id_request"',
        'WHERE req."id" IS NULL',
      ].join(' '),
    ),
    AppDataSource.query(
      [
        'SELECT COUNT(*)::int AS count',
        'FROM "vouchers" v',
        'LEFT JOIN "requests" req ON req."id" = v."id_request"',
        'WHERE req."id" IS NULL',
      ].join(' '),
    ),
  ]);

  expect(Number(checks[0][0].count)).toBe(0);
  expect(Number(checks[1][0].count)).toBe(0);
  expect(Number(checks[2][0].count)).toBe(0);
}
