/**
 * FileName: login.e2e-spec
 * Description: End-to-end tests for the Auth feature. Boots the full NestJS application
 *              and verifies POST /login, POST /login/logout, GET /login/profile,
 *              and POST /register endpoints.
 * Authors: Original Moncarca team
 * Last Modification made:
 * 18/05/2026 [Julio Rodríguez] Added negative login case, profile, and register tests.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from 'src/app.module';
import * as dotenv from 'dotenv';
import * as cookieParser from 'cookie-parser';

dotenv.config();

describe('Auth e2e', () => {
  let app: INestApplication;

  /**
   * beforeAll - Bootstraps the full NestJS application before any test runs.
   * Input: None
   * Output: Initializes the app instance with global ValidationPipe used across all e2e tests.
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
  });

  /**
   * afterAll - Closes the NestJS application after all tests have run.
   * Input: None
   * Output: Releases all app resources and connections.
   */
  afterAll(async () => {
    await app.close();
  });

  /**
   * POST /login - Verifies that an existing user can log in with valid credentials.
   * Input: email and password in request body.
   * Output: Passes if response status is 200 and body contains a success message.
   */
  it('/login (POST) should authenticate existing user', async () => {
    const res = await request(app.getHttpServer())
      .post('/login')
      .send({
        email: 'admin1@monarca.com',
        password: 'password',
      })
      .expect(200);

    expect(res.body).toHaveProperty('message');
    expect(res.body.message).toMatch(/logged in successfully/i);
  });

  /**
   * POST /login/logout - Verifies that an authenticated user can log out and clear the session.
   * Input: active session cookie from a prior login.
   * Output: Passes if response status is 200 and body contains a logout success message.
   */
  it('/logout (POST) should clear session', async () => {
    const agent = request.agent(app.getHttpServer());

    // First login
    await agent.post('/login').send({
      email: 'admin1@monarca.com',
      password: 'password',
    });

    // Then logout
    const res = await agent.post('/login/logout').expect(200);
    expect(res.body.message).toMatch(/logged out successfully/i);
  });

  /**
   * POST /login - Verifies that invalid credentials are rejected.
   * Input: email and wrong password.
   * Output: Passes if response status is 400.
   */
  it('/login (POST) should return 400 for invalid credentials', async () => {
    const res = await request(app.getHttpServer())
      .post('/login')
      .send({
        email: 'admin1@monarca.com',
        password: 'wrongpassword',
      });
    expect(res.status).toBe(400);
  });

  /**
   * POST /login - Verifies that missing body fields are rejected by ValidationPipe.
   * Input: Empty body (no email or password).
   * Output: Passes if response status is 400.
   */
  it('/login (POST) should return 400 when body fields are missing', async () => {
    const res = await request(app.getHttpServer())
      .post('/login')
      .send({});
    expect(res.status).toBe(400);
  });

  /**
   * GET /login/profile - Retrieves authenticated user profile.
   * Input: Valid session cookie from a prior login.
   * Output: Passes if response status is 200.
   */
  it('/login/profile (GET) should return profile with valid session', async () => {
    const agent = request.agent(app.getHttpServer());
    await agent
      .post('/login')
      .send({ email: 'admin1@monarca.com', password: 'password' });

    const res = await agent.get('/login/profile');
    expect(res.status).toBe(200);
  });

  /**
   * GET /login/profile - Requires an active session.
   * Input: No session cookie.
   * Output: Passes if response status is 400 (AuthGuard throws BadRequestException
   *         when sessionInfo cookie is absent).
   */
  it('/login/profile (GET) should return 400 when not authenticated', async () => {
    const res = await request(app.getHttpServer())
      .get('/login/profile');
    expect(res.status).toBe(400);
  });

  /**
   * POST /register - Creates a new user with valid data.
   * Input: Required user fields (email, name, last_name, password, status).
   * Output: Passes if response status is 200.
   */
  it('/register (POST) should create a user and return 200', async () => {
    const res = await request(app.getHttpServer())
      .post('/register')
      .send({
        email: `register-test-${Date.now()}@test.com`,
        name: 'Register',
        last_name: 'Test',
        password: 'password',
        status: 'active',
      });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('id');
  });

  /**
   * POST /register - Rejects missing required fields.
   * Input: Body without required email field.
   * Output: Passes if response status is 400 (ValidationPipe).
   */
  it('/register (POST) should return 400 when required fields are missing', async () => {
    const res = await request(app.getHttpServer())
      .post('/register')
      .send({
        name: 'No Email',
        last_name: 'User',
        password: 'password',
        status: 'active',
      });
    expect(res.status).toBe(400);
  });
});
