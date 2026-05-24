/**
 * FileName: login.controller.ts
 * Description: Controller for authentication endpoints. Handles user login (POST /login),
 *              logout (POST /login/logout), and profile retrieval (GET /login/profile).
 *              Profile route is protected by AuthGuard.
 * Authors: Original Monarca team
 * Last Modification made:
 * 21/05/2026 [Julio Rodriguez] Updated for login logs.
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
import { Response, Request } from 'express';
import { LogInDTO } from '../dto/login.dto';
import { LoginService } from '../services/login.service';
import { AuthGuard } from 'src/guards/auth.guard';

@Controller('login')
export class LoginController {
  constructor(private readonly loginService: LoginService) {}

  @Post()
  @HttpCode(200) // Changed to 200 for successful response
  logIn(@Body() data: LogInDTO, @Res({ passthrough: true }) res: Response, @Req() req: Request) {
    return this.loginService.logIn(data, res, req.ip ?? '');
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
