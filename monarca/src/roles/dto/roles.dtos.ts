import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsUUID } from 'class-validator';

export class CreateRoleDto {
  @ApiProperty({ example: 'admin' })
  @IsString()
  @IsNotEmpty()
  name: string;
}

export class UpdateRoleDto extends PartialType(CreateRoleDto) {}

export class CreatePermissionDto {
  @ApiProperty({ example: 'requests:create' })
  @IsString()
  @IsNotEmpty()
  name: string;
}

export class UpdatePermissionDto extends PartialType(CreatePermissionDto) {}

export class AssignPermissionToRoleDto {
  @ApiProperty({ example: 'uuid-of-permission' })
  @IsUUID()
  id_permission: string;
}

export class AssignRoleToUserDto {
  @ApiProperty({ example: 'uuid-of-role' })
  @IsUUID()
  id_role: string;
}
