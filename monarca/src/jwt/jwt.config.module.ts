/**
 * FileName: jwt.config.module.ts
 * Description: JWT configuration module. Registers the JwtModule with a secret
 *              from environment variables and sets token expiration to 1 hour.
 *              Exports JwtModule for use in other modules that require token signing.
 * Authors: Original Monarca team
 * Last Modification made:
 * 25/02/2026 [Sergio Jiawei Xuan] Added detailed comments and documentation for clarity and maintainability.
 */

import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '1h' },
    }),
  ],
  exports: [JwtModule],
})
export class JwtConfigModule {}
