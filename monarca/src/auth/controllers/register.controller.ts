/**
 * FileName: register.controller.ts
 * Description: Controller for user registration. Exposes a single POST /register endpoint
 *              that receives a CreateUserDto and delegates to RegisterService.
 * Authors: Original Monarca team
 * Last Modification made:
 * 25/02/2026 [Sergio Jiawei Xuan] Added detailed comments and documentation for clarity and maintainability.
 */

import { Controller, Post, Body } from '@nestjs/common';
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
  register(@Body() data: CreateUserDto) {
    return this.registerService.register(data);
  }
}
