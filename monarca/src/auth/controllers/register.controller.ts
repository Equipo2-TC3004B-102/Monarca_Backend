/**
 * FileName: register.controller.ts
 * Description: Controller for user registration. Exposes POST /register
 *              and delegates creation logic to RegisterService.
 * Authors: Original Monarca team
 * Last Modification made:
 * 11/04/2026 [Julio Rodriguez] Standardized explicit HTTP success code for
 *                              registration endpoint and aligned header format.
 */

import { Controller, Post, Body, HttpCode } from '@nestjs/common';
import { RegisterService } from '../services/register.service';
import { CreateUserDto } from 'src/users/dto/user.dtos';

@Controller('register')
export class RegisterController {
  constructor(private readonly registerService: RegisterService) {}

  /*
  Example request body for user registration:
  {
    "name": "",
    "last_name": "",
    "password": "",
    "email": ""
  }
  To change the role and department, modify the code in "register.service.ts" for now.
*/

  @Post()
  @HttpCode(200)
  register(@Body() data: CreateUserDto) {
    return this.registerService.register(data);
  }
}
