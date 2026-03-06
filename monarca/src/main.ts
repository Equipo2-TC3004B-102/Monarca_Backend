/**
 * FileName: main.ts
 * Description: Entry point of the Monarca NestJS application. Bootstraps the app,
 *              configures CORS, cookie parser, validation pipes, HTTPS (if certificates
 *              are present), and sets up Swagger API documentation.
 * Authors: Original Monarca team
 * Last Modification made:
 * 25/02/2026 [Sergio Jiawei Xuan] Added detailed comments and documentation for clarity and maintainability.
 */

import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { LoggingMiddleware } from './utils/logging.middleware';
import * as fs from 'fs';
import * as https from 'https';
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  // Read SSL certificate and key files if they exist
  const keyPath = 'certs/backend-key.pem';
  const certPath = 'certs/backend.pem';

  const options: any = {};

  if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
    options.httpsOptions = {
      key: fs.readFileSync(keyPath),
      cert: fs.readFileSync(certPath),
    };
  }

  const app = await NestFactory.create<NestExpressApplication>(
    AppModule,
    options,
  );

  // Enable CORS to allow requests from the frontend origin
  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  app.use(cookieParser());
  app.use(new LoggingMiddleware().use);
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Monarca API')
    .setDescription('The monarca API description')
    .setVersion('1.0')
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, documentFactory);

  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
