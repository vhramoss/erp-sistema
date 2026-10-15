import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsString, IsNumber, IsOptional, IsBoolean, IsNotEmpty,
  Min, Max, MaxLength, IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateProductDto {
  @ApiProperty({ example: 'Notebook Dell' })
  @IsString() @IsNotEmpty() @MaxLength(255)
  name: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString() @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional({ example: 'NB-001' })
  @IsOptional() @IsString() @MaxLength(100)
  sku?: string;

  @ApiPropertyOptional({ example: '7891234567890' })
  @IsOptional() @IsString() @MaxLength(50)
  barcode?: string;

  @ApiProperty({ example: 4999.99 })
  @IsNumber({ maxDecimalPlaces: 2 }) @Min(0)
  @Type(() => Number)
  price: number;

  @ApiPropertyOptional({ example: 3500.00 })
  @IsOptional() @IsNumber({ maxDecimalPlaces: 2 }) @Min(0)
  @Type(() => Number)
  cost?: number;

  @ApiPropertyOptional({ example: 50 })
  @IsOptional() @IsNumber() @Min(0)
  @Type(() => Number)
  stock?: number;

  @ApiPropertyOptional({ example: 5 })
  @IsOptional() @IsNumber() @Min(0)
  @Type(() => Number)
  minStock?: number;

  @ApiPropertyOptional({ example: 'un' })
  @IsOptional() @IsString() @MaxLength(20)
  unit?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsUUID()
  categoryId?: string;
}

export class UpdateProductDto extends PartialType(CreateProductDto) {
  @ApiPropertyOptional()
  @IsOptional() @IsBoolean()
  isActive?: boolean;
}

export class ProductQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsString()
  search?: string;

  @ApiPropertyOptional() @IsOptional() @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional() @IsOptional() @IsBoolean()
  @Type(() => Boolean)
  isActive?: boolean;

  @ApiPropertyOptional() @IsOptional() @IsBoolean()
  @Type(() => Boolean)
  lowStock?: boolean;

  @ApiPropertyOptional({ default: 1 }) @IsOptional() @IsNumber() @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20, maximum: 100 }) @IsOptional() @IsNumber() @Min(1) @Max(100)
  @Type(() => Number)
  limit?: number = 20;
}
