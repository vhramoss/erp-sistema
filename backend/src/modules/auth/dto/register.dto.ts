import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  Matches,
  IsNotEmpty,
} from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'Empresa XYZ Ltda' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  companyName: string;

  @ApiProperty({ example: '12.345.678/0001-90' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/, { message: 'CNPJ inválido (formato: 00.000.000/0000-00)' })
  cnpj: string;

  @ApiProperty({ example: 'empresa@email.com' })
  @IsEmail({}, { message: 'Email da empresa inválido' })
  companyEmail: string;

  @ApiProperty({ example: 'João Silva' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  adminName: string;

  @ApiProperty({ example: 'admin@empresa.com' })
  @IsEmail({}, { message: 'Email do administrador inválido' })
  adminEmail: string;

  @ApiProperty({ example: 'Senha@123' })
  @IsString()
  @MinLength(8)
  @MaxLength(100)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message: 'Senha deve conter maiúscula, minúscula, número e caractere especial',
  })
  password: string;
}
