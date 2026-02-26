/**
 * FileName: vouchers.e2e-spec
 * Description: End-to-end tests for the Vouchers feature. Boots the full NestJS
 *              application and verifies CRUD operations on the /vouchers endpoint.
 * Authors: Original Moncarca team
 * Last Modification made:
 * 25/02/2026 [Diego de la Vega] Added detailed comments and documentation for clarity and maintainability.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from 'src/app.module';
import * as dotenv from 'dotenv';
import { CreateVoucherDto } from 'src/vouchers/dto/create-voucher-dto';
import { UpdateVoucherDto } from 'src/vouchers/dto/update-voucher-dto';
dotenv.config();
describe('Vouchers e2e', () => {
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
   * GET /vouchers - Verifies that the endpoint returns an array of all vouchers.
   * Input: None
   * Output: Passes if status is 200 and response body is an array.
   */
  it('/vouchers (GET) debe retornar todas', async () => {
      const res = await request(app.getHttpServer())
        .get('/vouchers')
        .expect(200);
  
      expect(Array.isArray(res.body)).toBe(true);
    });

    /**
     * POST /vouchers - Verifies that a new voucher is created with valid DTO fields.
     * Input: id_request, class, amount, currency, date, file_url, status in request body.
     * Output: Passes if status is 201 and response body contains an id.
     */
    it('/vouchers (POST) debe registar una', async () => {
        const dto={
            id_request: "a2b5c8f1-d3e0-4c7b-8a9d-0f1e2d3c4b5a",
            class: "HOT hotel",
            amount: 150.0,
            currency: "YEN",
            date: "2025-04-25T00:00:00.000Z",
            file_url: "https://storage.example.com/vouchers/voucher-123.pdf",
            status: "voucher accepted"
          }

        const res = await request(app.getHttpServer())
          .post('/vouchers')
          .send(dto)
          .expect(201);
    
        expect(res.body).toHaveProperty('id');

      });

      /**
       * GET /vouchers/:id - Verifies that a voucher can be retrieved by its UUID.
       * Input: UUID of a freshly created voucher.
       * Output: Passes if status is 200 and response body id matches the created record.
       *         Cleans up by deleting the created record.
       */
      it('/vouchers/:id (GET) debe retornar una por ID', async () => {
          // 1) Creamos primero para obtener su ID dinámico
          const dto={
            id_request: "a2b5c8f1-d3e0-4c7b-8a9d-0f1e2d3c4b5a",
            class: "HOT hotel",
            amount: 150.0,
            currency: "YEN",
            date: "2025-04-25T00:00:00.000Z",
            file_url: "https://storage.example.com/vouchers/voucher-123.pdf",
            status: "voucher accepted"}

          const createRes = await request(app.getHttpServer())
            .post('/vouchers')
            .send(dto)
            .expect(201);
      
          const data = createRes.body;
      
          // 2) Ahora lo buscamos por ese mismo ID
          const res = await request(app.getHttpServer())
            .get(`/vouchers/${data.id}`)
            .expect(200);
      
          const retrieved_data = res.body;
          expect(retrieved_data.id).toBe(data.id);
      
          await request(app.getHttpServer())
            .delete(`/vouchers/${data.id}`)
            .expect(200);
        });

        /**
         * DELETE /vouchers/:id - Verifies that a voucher is deleted by its UUID.
         * Input: UUID of a freshly created voucher.
         * Output: Passes if DELETE returns 200.
         */
        it('/vouchers/:id (DELTE) debe eliminar una por ID', async () => {
        // 1) Creamos primero para obtener su ID dinámico
        const dto={
          id_request: "a2b5c8f1-d3e0-4c7b-8a9d-0f1e2d3c4b5a",
          class: "HOT hotel",
          amount: 150.0,
          currency: "YEN",
          date: "2025-04-25T00:00:00.000Z",
          file_url: "https://storage.example.com/vouchers/voucher-123.pdf",
          status: "voucher accepted"}

        const createRes = await request(app.getHttpServer())
          .post('/vouchers')
          .send(dto)
          .expect(201);
    
        const data = createRes.body;
    
        // 2) Ahora lo eliminamos por ese mismo ID
        const res = await request(app.getHttpServer())
          .delete(`/vouchers/${data.id}`)
          .expect(200);

      });
      
      /**
       * PATCH /vouchers/:id - Verifies that a voucher's fields can be partially updated.
       * Input: UUID of a freshly created voucher; updated amount and currency in request body.
       * Output: Passes if PATCH returns 200. Cleans up by deleting the created record.
       */
      it('/vouchers/:id (PATCH) debe actualizar una por ID', async () => {
        // 1) Creamos primero para obtener su ID dinámico
        const dto={
          id_request: "a2b5c8f1-d3e0-4c7b-8a9d-0f1e2d3c4b5a",
          class: "HOT hotel",
          amount: 150.0,
          currency: "YEN",
          date: "2025-04-25T00:00:00.000Z",
          file_url: "https://storage.example.com/vouchers/voucher-123.pdf",
          status: "voucher accepted"
        }
        const update_dto={
            id_request: "a2b5c8f1-d3e0-4c7b-8a9d-0f1e2d3c4b5a",
            class: "HOT hotel",
            amount: 200.0,//we update the amount
            currency: "BOL" //we update the curency
          }

        const createRes = await request(app.getHttpServer())
          .post('/vouchers')
          .send(dto)
          .expect(201);
    
        const data = createRes.body;
            
        const createPatch= await request(app.getHttpServer())
            .patch(`/vouchers/${data.id}`)
            .send(update_dto)
            .expect(200)


        await request(app.getHttpServer())
          .delete(`/vouchers/${data.id}`)
          .expect(200);
      });








});