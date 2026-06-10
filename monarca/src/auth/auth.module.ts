/**
 * FileName: auth.module.ts
 * Description: Authentication module. Registers the login and register controllers
 *              and services, imports JwtConfigModule for token handling and UsersModule
 *              for user lookups. Exports auth services and JWT module for use in other modules.
 * Authors: Original Monarca team
 * Last Modification made:
 * 21/05/2026 [Julio Rodriguez] Added UserLogsModule to imports for logging login/logout actions; updated comments for clarity.
 */

import { Module, forwardRef } from '@nestjs/common';
import { LoginController } from './controllers/login.controller';
import { LoginService } from './services/login.service';
import { JwtConfigModule } from 'src/jwt/jwt.config.module';
import { UsersModule } from 'src/users/users.module';
import { RegisterController } from './controllers/register.controller';
import { RegisterService } from './services/register.service';
import { UserLogsModule } from 'src/user-logs/user-logs.module';

@Module({
  imports: [JwtConfigModule, UsersModule, UserLogsModule],
  controllers: [LoginController, RegisterController],
  providers: [LoginService, RegisterService],
  exports: [LoginService, RegisterService, JwtConfigModule],
})
export class AuthModule {}
