/**
 * FileName: auth.guard.ts
 * Description: Guard that protects routes by validating the JWT token sent in the sessionInfo cookie. 
 *              If the token is valid, it attaches the user information to the request object for use in controllers and services. 
 *              If the token is missing or invalid, it throws an UnauthorizedException.
 * Authors: Original Monarca team
 * Last Modification made:
 * 07/04/2026 [Julio Rodriguez]  Added comments for clarity and maintainability, and standardized error messages for better debugging.
 */

import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  CanActivate,
  ExecutionContext, // Added for better type safety and clarity in the guard implementation
} from '@nestjs/common';
import { Request } from 'express';
import { JwtService } from '@nestjs/jwt';

interface SessionInfo {
  id: number;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest() as Request & {
      sessionInfo: SessionInfo;
    };

    const token = request.cookies['sessionInfo'];
    //console.log('TOKEN:', token);
    if (!token) {
      throw new BadRequestException({
        message: 'Invalid authentication context',
        code: 'AUTH_MISSING_TOKEN', // 400 error code for missing token
      });
    }

    try {
      const payload = await this.jwtService.verifyAsync(token);
      request.sessionInfo = payload; // Attach user to the request
      // console.log(request);
      return true;
    } catch (err) { // When token verification fails, we check the error type to provide more specific feedback
      if ( // Added specific error types for better debugging using the error name for search with jsonwebtoken library documentation. Recovered from: https://github.com/auth0/node-jsonwebtoken
        err instanceof Error && ['JsonWebTokenError', 'TokenExpiredError', 'NotBeforeError'].includes(err.name,) // Added specific error types for better debugging using the error name for search with jsonwebtoken library documentation. Recovered from: https://github.com/auth0/node-jsonwebtoken
      ) {
        throw new BadRequestException({
          message: 'Invalid authentication context', // More specific error message for invalid token
          code: 'AUTH_INVALID_TOKEN', // 400 error code for invalid token
        });
      }

      throw new InternalServerErrorException({
        message: 'Unable to validate authentication context', // More specific error message for unexpected errors in the guard
        code: 'AUTH_GUARD_INTERNAL_ERROR', // 500 error code for unexpected errors in the guard
      });
    }
  }
}
