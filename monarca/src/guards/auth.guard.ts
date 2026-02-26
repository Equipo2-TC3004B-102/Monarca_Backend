/**
 * auth.guard.ts
 * Description: NestJS guard that implements JWT-based authentication. Extracts the
 * JWT token from the 'sessionInfo' cookie, verifies it using JwtService, and attaches
 * the decoded payload to the request object. Throws UnauthorizedException if no token
 * is provided or if the token is invalid.
 * Authors: Original Monarca team
 * Last Modification made:
 * 25/02/2026 [Juan Pablo Narchi Capote] Added detailed comments and documentation for clarity and maintainability.
 */

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
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

  /**
   * canActivate, validates the JWT token from the request cookies and attaches
   * the decoded session info to the request object.
   * Input: context (ExecutionContext) - the NestJS execution context containing the HTTP request.
   * Output: boolean - true if the token is valid, throws UnauthorizedException otherwise.
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest() as Request & {
      sessionInfo: SessionInfo;
    };

    const token = request.cookies['sessionInfo'];
    //console.log('TOKEN:', token);
    if (!token) {
      throw new UnauthorizedException('No token provided');
    }

    try {
      const payload = await this.jwtService.verifyAsync(token);
      request.sessionInfo = payload; // Attach user to the request
      // console.log(request);
      return true;
    } catch (err) {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
