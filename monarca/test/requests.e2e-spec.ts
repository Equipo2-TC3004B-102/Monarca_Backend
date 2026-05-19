/**
 * FileName: requests.e2e-spec.ts
 * Description: End-to-end tests for the Requests feature. Verifies POST /requests,
 *              GET /requests/user, GET /requests/all, and GET /requests/:id endpoints.
 *              All routes require AuthGuard + PermissionsGuard. Missing auth returns 400.
 * Authors: DebugStudio Team
 * Last Modification made:
 * 18/05/2026 [Julio Rodríguez] Initial e2e test suite for requests endpoints.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from 'src/app.module';
import * as dotenv from 'dotenv';
import * as cookieParser from 'cookie-parser';

dotenv.config();

const REQUESTER_EMAIL = 'requester1@monarca.com';
const ADMIN_EMAIL = 'admin1@monarca.com';
const PASSWORD = 'password';
const ORIGIN_CITY_ID = 'd7ee631a-c1b8-42f0-8ae6-cd4d6b23470f';
const DEST_CITY_ID = '04963809-842e-457a-97aa-ac885bd6e1bf';
const INVALID_UUID = 'not-a-uuid';

const VALID_REQUEST_BODY = {
  id_origin_city: ORIGIN_CITY_ID,
  title: 'E2E Test Trip',
  motive: 'Testing the requests endpoint via e2e spec.',
  advance_money: 5000,
  currency: 'MXN',
  priority: 'medium',
  requests_destinations: [
    {
      id_destination: DEST_CITY_ID,
      destination_order: 1,
      stay_days: 3,
      arrival_date: '2026-06-01T10:00:00Z',
      departure_date: '2026-06-04T10:00:00Z',
      is_hotel_required: true,
      is_plane_required: true,
      is_last_destination: true,
      details: 'E2E test destination',
    },
  ],
};

describe('Requests e2e', () => {
  let app: INestApplication;
  let createdRequestId: string;

  /**
   * beforeAll - Bootstraps app and creates one request as requester1 for GET tests.
   *             Requires db:seed to have been run (global approval level must exist).
   * Input: None
   * Output: Initialized app; createdRequestId populated.
   */
  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );
    app.use(cookieParser());
    await app.init();

    const agent = request.agent(app.getHttpServer());
    await agent
      .post('/login')
      .send({ email: REQUESTER_EMAIL, password: PASSWORD });
    const res = await agent.post('/requests').send(VALID_REQUEST_BODY);
    if (res.status === 200 && res.body?.id) {
      createdRequestId = res.body.id;
    }
  });

  /**
   * afterAll - Closes the NestJS application after all tests have run.
   * Input: None
   * Output: Releases all app resources and connections.
   */
  afterAll(async () => {
    await app.close();
  });

  // ---------------------------------------------------------------------------
  // POST /requests
  // ---------------------------------------------------------------------------

  /**
   * POST /requests - Requires auth. Missing session cookie returns 400.
   * Input: No auth cookie, valid body.
   * Output: Passes if response status is 400.
   */
  it('/requests (POST) should return 400 when not authenticated', async () => {
    const res = await request(app.getHttpServer())
      .post('/requests')
      .send(VALID_REQUEST_BODY);
    expect(res.status).toBe(400);
  });

  /**
   * POST /requests - Creates a travel request as authenticated requester.
   * Input: Valid session cookie + valid CreateRequestDto body.
   * Output: Passes if response status is 200 and body contains an id.
   */
  it('/requests (POST) should create a request and return 200', async () => {
    const agent = request.agent(app.getHttpServer());
    await agent
      .post('/login')
      .send({ email: REQUESTER_EMAIL, password: PASSWORD });

    const res = await agent.post('/requests').send(VALID_REQUEST_BODY);
    if (res.status !== 200) console.error('POST /requests body:', res.body);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('id');
  });

  /**
   * POST /requests - Rejects a body missing required fields.
   * Input: Valid session + body without required title field.
   * Output: Passes if response status is 400 (ValidationPipe).
   */
  it('/requests (POST) should return 400 when required fields are missing', async () => {
    const agent = request.agent(app.getHttpServer());
    await agent
      .post('/login')
      .send({ email: REQUESTER_EMAIL, password: PASSWORD });

    const res = await agent.post('/requests').send({
      id_origin_city: ORIGIN_CITY_ID,
      advance_money: 1000,
      currency: 'MXN',
      priority: 'low',
    });
    expect(res.status).toBe(400);
  });

  // ---------------------------------------------------------------------------
  // GET /requests/user
  // ---------------------------------------------------------------------------

  /**
   * GET /requests/user - Requires auth. Returns requests belonging to the caller.
   * Input: Valid session cookie from requester1.
   * Output: Passes if response status is 200 and body is an array.
   */
  it('/requests/user (GET) should return requester own requests with status 200', async () => {
    const agent = request.agent(app.getHttpServer());
    await agent
      .post('/login')
      .send({ email: REQUESTER_EMAIL, password: PASSWORD });

    const res = await agent.get('/requests/user');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  /**
   * GET /requests/user - Requires auth. Missing session cookie returns 400.
   * Input: No auth cookie.
   * Output: Passes if response status is 400.
   */
  it('/requests/user (GET) should return 400 when not authenticated', async () => {
    const res = await request(app.getHttpServer()).get('/requests/user');
    expect(res.status).toBe(400);
  });

  // ---------------------------------------------------------------------------
  // GET /requests/all
  // ---------------------------------------------------------------------------

  /**
   * GET /requests/all - Returns all requests. Requires view_assigned_requests_readonly.
   * Input: Valid session cookie from admin1.
   * Output: Passes if response status is 200 and body is an array.
   */
  it('/requests/all (GET) should return all requests with status 200', async () => {
    const agent = request.agent(app.getHttpServer());
    await agent.post('/login').send({ email: ADMIN_EMAIL, password: PASSWORD });

    const res = await agent.get('/requests/all');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  /**
   * GET /requests/all - Requires auth. Missing session cookie returns 400.
   * Input: No auth cookie.
   * Output: Passes if response status is 400.
   */
  it('/requests/all (GET) should return 400 when not authenticated', async () => {
    const res = await request(app.getHttpServer()).get('/requests/all');
    expect(res.status).toBe(400);
  });

  // ---------------------------------------------------------------------------
  // GET /requests/:id
  // ---------------------------------------------------------------------------

  /**
   * GET /requests/:id - Retrieves a request by valid UUID.
   * Input: Valid session + UUID created in beforeAll.
   * Output: Passes if response status is 200.
   */
  it('/requests/:id (GET) should return a request by valid UUID', async () => {
    if (!createdRequestId) {
      console.warn('Skipping: no request was created in beforeAll');
      return;
    }
    const agent = request.agent(app.getHttpServer());
    await agent
      .post('/login')
      .send({ email: REQUESTER_EMAIL, password: PASSWORD });

    const res = await agent.get(`/requests/${createdRequestId}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('id', createdRequestId);
  });

  /**
   * GET /requests/:id - Rejects an invalid UUID format.
   * Input: Valid session + non-UUID string as id.
   * Output: Passes if response status is 400 (ParseUUIDPipe).
   */
  it('/requests/:id (GET) should return 400 for invalid UUID format', async () => {
    const agent = request.agent(app.getHttpServer());
    await agent
      .post('/login')
      .send({ email: REQUESTER_EMAIL, password: PASSWORD });

    const res = await agent.get(`/requests/${INVALID_UUID}`);
    expect(res.status).toBe(400);
  });
});
