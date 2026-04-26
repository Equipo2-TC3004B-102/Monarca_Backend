import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Roles } from './entity/roles.entity';
import { Permission } from './entity/permissions.entity';
import { RolePermission } from './entity/roles_permissions.entity';
import { RolesService } from './roles.service';
import { RolesController } from './roles.controller';
import { PermissionsController } from './permissions.controller';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Roles, Permission, RolePermission]),
    forwardRef(() => UsersModule),
  ],
  controllers: [RolesController, PermissionsController],
  providers: [RolesService],
  exports: [RolesService],
})
export class RolesModule {}
