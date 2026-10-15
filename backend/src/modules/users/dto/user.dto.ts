import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { IsString, IsEmail, IsEnum, IsOptional, IsBoolean, MinLength, MaxLength, Matches, IsNotEmpty } from 'class-validator';

export class CreateUserDto {
  @ApiProperty() @IsString() @IsNotEmpty() @MaxLength(255)
  name: string;

  @ApiProperty() @IsEmail()
  email: string;

  @ApiProperty()
  @IsString() @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message: 'Senha deve ter maiúscula, minúscula, número e caractere especial',
  })
  password: string;

  @ApiPropertyOptional({ enum: UserRole, default: UserRole.USER })
  @IsOptional() @IsEnum(UserRole)
  role?: UserRole;
}

export class UpdateUserDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({ enum: UserRole }) @IsOptional() @IsEnum(UserRole)
  role?: UserRole;

  @ApiPropertyOptional() @IsOptional() @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional() @IsOptional() @IsString()
  avatar?: string;
}

export class ChangePasswordDto {
  @ApiProperty() @IsString() @IsNotEmpty()
  currentPassword: string;

  @ApiProperty()
  @IsString() @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message: 'Senha deve ter maiúscula, minúscula, número e caractere especial',
  })
  newPassword: string;
}
