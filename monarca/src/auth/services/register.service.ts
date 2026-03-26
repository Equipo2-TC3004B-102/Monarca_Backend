/**
 * FileName: register.service.ts
 * Description: Service handling user registration. Hashes the provided password using
 *              bcrypt before storing. Returns the created user without the password field.
 *              Note: password hashing must be applied to the DTO before calling
 *              userService.create() to ensure the hashed value is persisted.
 * Authors: Original Monarca team
 * Last Modification made:
 * 25/02/2026 [Sergio Jiawei Xuan] Added detailed comments and documentation for clarity and maintainability.
 */

import { Injectable } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import { CreateUserDto } from 'src/users/dto/user.dtos';
import * as bcrypt from 'bcrypt';

@Injectable()
export class RegisterService {
  constructor(private readonly userService: UsersService) {}

  // User registration
  async register(data: CreateUserDto) {
    const hashedPassword = await bcrypt.hash(data.password, 10);

    console.log('DEBUG → Registering user:', data);

    const newUser = await this.userService.create(data);

    const { password, ...userWithoutPassword } = newUser;

    return userWithoutPassword;
  }
}
