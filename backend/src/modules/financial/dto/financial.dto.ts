import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { TransactionType, TransactionCategory } from '@prisma/client';
import { IsString, IsOptional, IsEnum, IsNumber, IsBoolean, IsDateString, IsNotEmpty, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateTransactionDto {
  @ApiProperty({ enum: TransactionType })
  @IsEnum(TransactionType)
  type: TransactionType;

  @ApiPropertyOptional({ enum: TransactionCategory })
  @IsOptional() @IsEnum(TransactionCategory)
  category?: TransactionCategory;

  @ApiProperty({ example: 'Pagamento de fornecedor' })
  @IsString() @IsNotEmpty()
  description: string;

  @ApiProperty({ example: 1500.00 })
  @IsNumber({ maxDecimalPlaces: 2 }) @Min(0.01)
  @Type(() => Number)
  amount: number;

  @ApiProperty({ example: '2026-04-22' })
  @IsDateString()
  date: string;

  @ApiPropertyOptional()
  @IsOptional() @IsBoolean()
  isPaid?: boolean;

  @ApiPropertyOptional({ example: '2026-05-01' })
  @IsOptional() @IsDateString()
  dueDate?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  notes?: string;
}

export class UpdateTransactionDto extends PartialType(CreateTransactionDto) {}

export class FinancialQueryDto {
  @ApiPropertyOptional({ enum: TransactionType }) @IsOptional() @IsEnum(TransactionType)
  type?: TransactionType;

  @ApiPropertyOptional({ enum: TransactionCategory }) @IsOptional() @IsEnum(TransactionCategory)
  category?: TransactionCategory;

  @ApiPropertyOptional() @IsOptional() @IsBoolean()
  @Type(() => Boolean)
  isPaid?: boolean;

  @ApiPropertyOptional({ example: '2026-01-01' }) @IsOptional() @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ example: '2026-12-31' }) @IsOptional() @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ default: 1 }) @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 }) @IsOptional()
  @Type(() => Number)
  limit?: number = 20;
}
