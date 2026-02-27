/**
 * FileName: login.service.ts
 * Description: Service handling login, logout and profile logic. On login, validates
 *              credentials via UserChecks, signs a JWT and sets it as an httpOnly cookie
 *              (sessionInfo). On logout, clears the cookie. On profile, retrieves the
 *              current user by ID from the JWT payload.
 * Authors: Original Monarca team
 * Last Modification made:
 * 25/02/2026 [Sergio Jiawei Xuan] Added detailed comments and documentation for clarity and maintainability.
 */

import { Injectable } from '@nestjs/common';
import { Response } from 'express';
import { LogInDTO } from '../dto/login.dto';
import { JwtService } from '@nestjs/jwt';
import { UserChecks } from 'src/users/user.checks.service';
import { User } from 'src/users/entities/user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class LoginService {
  constructor(
    private readonly userChecks: UserChecks,
    private readonly jwtService: JwtService,
  ) {}

  async logIn(data: LogInDTO, res: Response) {
    const user = await this.userChecks.logIn(data);

    if (!user) {
      return { status: false, message: 'Email or password incorrect' };
    }

    // Verify the password
    const isPasswordValid = await bcrypt.compare(data.password, user.password);

    if (!isPasswordValid) {
      return { status: false, message: 'Email or password incorrect' };
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

    return { status: true, message: 'Logged in successfully' };
  }

  async logOut(res: Response) {
    res.clearCookie('sessionInfo', {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
    });
    return { status: true, message: 'Logged out successfully' };
  }

  async profile(req: any) {
    const { id } = req.sessionInfo;
    // get user by id with their permissions
    const user = await this.userChecks.getUserById(id);

    return { status: true, user };
  }
}
