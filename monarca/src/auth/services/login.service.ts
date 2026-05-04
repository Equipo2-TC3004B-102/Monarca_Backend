/**
 * FileName: login.service.ts
 * Description: Service handling login, logout and profile logic. On login, validates
 *              credentials via UserChecks, signs a JWT and sets it as an httpOnly cookie
 *              (sessionInfo). On logout, clears the cookie. On profile, retrieves the
 *              current user by ID from the JWT payload.
 * Authors: Original Monarca team
 * Last Modification made:
 * 04/05/2026 [Julio Rodríguez] profile() now overrides role.permissions with flag-derived permissions so the frontend reads the correct permission set.
 */

import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { Response } from 'express';
import { LogInDTO } from '../dto/login.dto';
import { JwtService } from '@nestjs/jwt';
import { UserChecks } from 'src/users/user.checks.service';
import { FLAG_PERMISSIONS } from 'src/guards/permissions.guard';
import * as bcrypt from 'bcrypt';

@Injectable()
export class LoginService {
  constructor(
    private readonly userChecks: UserChecks,
    private readonly jwtService: JwtService,
  ) {}

  async logIn(data: LogInDTO, res: Response) {
    try {
      const user = await this.userChecks.logIn(data);

      if (!user) {
        throw new BadRequestException({ // More specific error message and code for invalid credentials
          message: 'Email or password incorrect',
          code: 'AUTH_INVALID_CREDENTIALS', // 400 error code for invalid credentials
        });
      }

      // Verify the password
      const isPasswordValid = await bcrypt.compare(data.password, user.password);

      if (!isPasswordValid) {
        throw new BadRequestException({ // More specific error message and code for invalid credentials
          message: 'Email or password incorrect',
          code: 'AUTH_INVALID_CREDENTIALS', // 400 error code for invalid credentials
        });
      }

      const payload = { id: user.id };
      const token = this.jwtService.sign(payload);

      // Cookie configuration for frontend connection
      res.cookie('sessionInfo', token, {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        maxAge: 3600 * 1000, // 1 hour
      });

      return { status: true, message: 'Logged in successfully' }; // More specific success message for successful login
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new InternalServerErrorException({ // More specific error message and code for internal server errors during login
        message: 'Unable to process login',
        code: 'AUTH_LOGIN_INTERNAL_ERROR', // 500 error code for internal server error during login
      });
    }
  }

  async logOut(res: Response) {
    try {
      res.clearCookie('sessionInfo', {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
      });
      return { status: true, message: 'Logged out successfully' };
    } catch (error) {
      throw new InternalServerErrorException({
        message: 'Unable to process logout',
        code: 'AUTH_LOGOUT_INTERNAL_ERROR', // 500 error code for internal server error during logout
      });
    }
  }

  async profile(req: any) {
    try {
      const id = req?.sessionInfo?.id;

      if (!id) {
        throw new BadRequestException({
          message: 'Invalid session context',
          code: 'AUTH_INVALID_SESSION',
        });
      }

      const user = await this.userChecks.getUserById(id);

      if (!user) {
        throw new BadRequestException({
          message: 'Session user not found',
          code: 'AUTH_SESSION_USER_NOT_FOUND',
        });
      }

      // Derive permissions from flags so the frontend reads the same set that PermissionsGuard enforces.
      const flagPermissions = [
        ...new Set(
          Object.entries(FLAG_PERMISSIONS)
            .filter(([flag]) => (user as any)[flag])
            .flatMap(([, perms]) => perms),
        ),
      ].map((name) => ({ name }));

      if (user.role) {
        (user.role as any).permissions = flagPermissions;
      } else {
        (user as any).role = { name: 'user', permissions: flagPermissions };
      }

      return { status: true, user };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new InternalServerErrorException({
        message: 'Unable to fetch profile',
        code: 'AUTH_PROFILE_INTERNAL_ERROR', // 500 error code for internal server error during profile retrieval
      });
    }
  }
}
