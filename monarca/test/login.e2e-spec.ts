/**
 * FileName: login.e2e-spec
 * Description: End-to-end tests for the Auth feature. Boots the full NestJS application
 *              and verifies that the POST /login and POST /login/logout endpoints
 *              authenticate and de-authenticate users correctly.
 * Authors: Original Moncarca team
 * Last Modification made:
 * 25/02/2026 [Diego de la Vega] Added detailed comments and documentation for clarity and maintainability.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from 'src/app.module';
import * as dotenv from 'dotenv';

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
   * Output: Passes if response status is 201 and body contains a success message.
   */
  it('/login (POST) should authenticate existing user', async () => {
    const res = await request(app.getHttpServer())
      .post('/login')
      .send({
        email: 'admin-uuid@example.com',
        password: 'password',
      })
      .expect(201);

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
      email: 'admin-uuid@example.com',
      password: 'password',
    });

    // Then logout
    const res = await agent.post('/login/logout').expect(200);
    expect(res.body.message).toMatch(/logged out successfully/i);
  });
});
