/**
 * FileName: login.controller.ts
 * Description: Controller for authentication endpoints. Handles user login (POST /login),
 *              logout (POST /login/logout), and profile retrieval (GET /login/profile).
 *              Profile route is protected by AuthGuard.
 * Authors: Original Monarca team
 * Last Modification made:
 * 07/04/2026 [Julio Rodriguez] Added correct HTTP status codes for each endpoint and detailed comments for clarity and maintainability. Deleated non using code.
 */

import {
  Controller,
  Post,
  Body,
  Res,
  Get,
  Req,
  UseGuards,
  HttpCode,
} from '@nestjs/common';
import { Response } from 'express';
import { LogInDTO } from '../dto/login.dto';
import { LoginService } from '../services/login.service';
import { AuthGuard } from 'src/guards/auth.guard';

@Controller('login')
export class LoginController {
  constructor(private readonly loginService: LoginService) {}

  @Post()
  @HttpCode(200) // Changed to 200 for successful response
  logIn(@Body() data: LogInDTO, @Res({ passthrough: true }) res: Response) {
    return this.loginService.logIn(data, res);
  }
  @Post('logout')
  @HttpCode(200) // Changed to 200 for successful response
  logOut(@Res({ passthrough: true }) res: Response) {
    return this.loginService.logOut(res);
  }

  // Test for cookie sending and the logged in user
  @UseGuards(AuthGuard)
  @Get('profile')
  getProfile(@Req() req: any, @Res({ passthrough: true }) res: Response) {
    return this.loginService.profile(req);
  }
}
