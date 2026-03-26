/**
 * FileName: reservations.e2e-spec
 * Description: End-to-end tests for the Reservations feature. Boots the full NestJS
 *              application and verifies CRUD operations on the /reservations endpoint.
 * Authors: Original Moncarca team
 * Last Modification made:
 * 25/02/2026 [Diego de la Vega] Added detailed comments and documentation for clarity and maintainability.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from 'src/app.module';
import * as dotenv from 'dotenv';
import {
  CreateReservationDto,
  ReservationDto,
} from 'src/reservations/dto/reservation.dtos';
dotenv.config();

describe('reservations e2e', () => {
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
   * POST /reservations - Verifies that a new reservation is created with valid DTO fields.
   * Input: title, comments, link, id_request_destination in request body.
   * Output: Passes if status is 201, body has an id, and all sent fields match.
   *         Cleans up by deleting the created record.
   */
  it('/reservations (POST) debe crear una reservacion', async () => {
    const dto = {
      title: 'Reserva de taxi aeropuerto',
      comments:
        'Taxi reservado para el usuario María García, llegada estimada a las 08:30 AM',
      link: 'https://taxi-service.com/booking/abc123',
      id_request_destination: '17c8984c-ee37-44cf-8138-9728063b4560',
    };
    const res = await request(app.getHttpServer())
      .post('/reservations')
      .send(dto)
      .expect(201);
    console.log('Raw Response:', res.body);

    expect(res.body).toHaveProperty('id');

    const data = res.body;

    expect(data.title).toBe(dto.title);
    expect(data.comments).toBe(dto.comments);
    expect(data.link).toBe(dto.link);
    expect(data.id_request_destination).toBe(dto.id_request_destination);
    await request(app.getHttpServer())
      .delete(`/reservations/${data.id}`)
      .expect(200);
  });

  /**
   * GET /reservations - Verifies that the endpoint returns an array of all reservations.
   * Input: None
   * Output: Passes if status is 200 and response body is an array.
   */
  it('/reservations (GET) debe retornar todas las reservaciones', async () => {
    const res = await request(app.getHttpServer())
      .get('/reservations')
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
  });

  /**
   * GET /reservations/:id - Verifies that a reservation can be retrieved by its UUID.
   * Input: UUID of a freshly created reservation.
   * Output: Passes if status is 200 and response body id matches the created record.
   *         Cleans up by deleting the created record.
   */
  it('/reservations/:id (GET) debe retornar una reserva por ID', async () => {
    // 1) Creamos primero para obtener su ID dinámico
    const createRes = await request(app.getHttpServer())
      .post('/reservations')
      .send({
        title: 'Reserva de taxi',
        comments: 'Taxi reservado para el usuario',
        link: 'https://example.com/reservation/12345',
        id_request_destination: '17c8984c-ee37-44cf-8138-9728063b4560',
      })
      .expect(201);

    const data = createRes.body;

    // 2) Ahora lo buscamos por ese mismo ID
    const res = await request(app.getHttpServer())
      .get(`/reservations/${data.id}`)
      .expect(200);

    const retrieved_data = res.body;
    expect(retrieved_data.id).toBe(data.id);

    await request(app.getHttpServer())
      .delete(`/reservations/${data.id}`)
      .expect(200);
  });

  /**
   * PATCH /reservations/:id - Verifies that a reservation's fields can be partially updated.
   * Input: UUID of a freshly created reservation; updated comments field in request body.
   * Output: Passes if status is 200 and the retrieved record reflects the updated comments.
   *         Cleans up by deleting the created record.
   */
  it('/reservations/:id (PATCH) debe actualizar uno o mas parametros de la reserva', async () => {
    // 1) Creamos primero para obtener su ID dinámico
    const createRes = await request(app.getHttpServer())
      .post('/reservations')
      .send({
        title: 'Reserva de taxi',
        comments: 'Taxi reservado para el usuario',
        link: 'https://example.com/reservation/12345',
        id_request_destination: '8c9d0e1f-2a3b-4c5d-6e7f-8a9b0c1d2e3f',
      })
      .expect(201);

    const data = createRes.body
    // 2) Ahora lo actualizamos su comentario
    const updatedComment =
      'Taxi reservado para el usuario Juan Pérez, llegada estimada a las 09:00 AM';
    const res = await request(app.getHttpServer())
      .patch(`/reservations/${data.id}`)
      .send({ comments: updatedComment })
      .expect(200);

    const updatedReservation = await request(app.getHttpServer())
      .get(`/reservations/${data.id}`)
      .expect(200);

    const retrieved_data = updatedReservation.body;
    expect(retrieved_data.comments).toBe(updatedComment);

    await request(app.getHttpServer())
      .delete(`/reservations/${data.id}`)
      .expect(200);
  });

  /**
   * DELETE /reservations/:id - Verifies that a reservation is deleted and no longer retrievable.
   * Input: UUID of a freshly created reservation.
   * Output: Passes if DELETE returns 200 and subsequent GET returns 404.
   */
  it('/reservations/:id (DELETE) debe borrar la reserva', async () => {
    // 1) Creamos primero para obtener su ID dinámico
    const createRes = await request(app.getHttpServer())
      .post('/reservations')
      .send({
        title: 'Reserva de taxi',
        comments: 'Taxi reservado para el usuario',
        link: 'https://example.com/reservation/12345',
        id_request_destination: '17c8984c-ee37-44cf-8138-9728063b4560',
      })
      .expect(201);

    const data = createRes.body;
    // 2) Ahora la borramos

    await request(app.getHttpServer())
      .delete(`/reservations/${data.id}`)
      .expect(200);

    // 3) Verificamos que ya no existe
    await request(app.getHttpServer())
      .get(`/reservations/${data.id}`)
      .expect(404);
  });
});
