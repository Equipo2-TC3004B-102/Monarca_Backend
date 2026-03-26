/**
 * FileName: auth.module.ts
 * Description: Authentication module. Registers the login and register controllers
 *              and services, imports JwtConfigModule for token handling and UsersModule
 *              for user lookups. Exports auth services and JWT module for use in other modules.
 * Authors: Original Monarca team
 * Last Modification made:
 * 25/02/2026 [Sergio Jiawei Xuan] Added detailed comments and documentation for clarity and maintainability.
 */

import { Module, forwardRef } from '@nestjs/common';
import { LoginController } from './controllers/login.controller';
import { LoginService } from './services/login.service';
import { JwtConfigModule } from 'src/jwt/jwt.config.module';
import { UsersModule } from 'src/users/users.module';
import { RegisterController } from './controllers/register.controller';
import { RegisterService } from './services/register.service';

@Module({
  imports: [JwtConfigModule, UsersModule],
  controllers: [LoginController, RegisterController],
  providers: [LoginService, RegisterService],
  exports: [LoginService, RegisterService, JwtConfigModule],
})
export class AuthModule {}
