/**
 * FileName: notifications.e2e-spec
 * Description: End-to-end tests for the Notifications feature. Boots the full NestJS
 *              application and verifies that the POST /notifications/send endpoint
 *              correctly sends an email and returns the expected response.
 * Authors: Original Moncarca team
 * Last Modification made:
 * 25/02/2026 [Diego de la Vega] Added detailed comments and documentation for clarity and maintainability.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../app.module';

describe('NotificationsController (e2e)', () => {
  let app: INestApplication;

  /**
   * beforeAll - Bootstraps the full NestJS application before any test runs.
   * Input: None
   * Output: Initializes the app instance used across all e2e tests.
   */
  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule], // Incluye todo el backend real
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  /**
   * POST /notifications/send - Verifies the email send endpoint responds with status 201
   *                             and a success message when given valid payload.
   * Input: to, subject, text fields in request body.
   * Output: Passes if response status is 201 and body.message equals 'Correo enviado correctamente.'
   */
  it('/notifications/send (POST) - should send email', async () => {
    const response = await request(app.getHttpServer())
      .post('/notifications/send')
      .send({
        to: 'correo@ejemplo.com',
        subject: 'Prueba E2E',
        text: 'Esto es una prueba end-to-end',
      });

    expect(response.status).toBe(201);
    expect(response.body.message).toBe('Correo enviado correctamente.');

  });

  /**
   * afterAll - Closes the NestJS application after all tests have run.
   * Input: None
   * Output: Releases all app resources and connections.
   */
  afterAll(async () => {
    await app.close();
  });
});
