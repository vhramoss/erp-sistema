import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsNotEmpty, MaxLength, IsUUID } from 'class-validator';

export class ChatMessageDto {
  @ApiProperty({ example: 'Qual foi o faturamento do mês passado?' })
  @IsString() @IsNotEmpty() @MaxLength(2000)
  message: string;

  @ApiPropertyOptional({ description: 'ID da conversa existente para continuar' })
  @IsOptional() @IsUUID()
  conversationId?: string;
}

export class CreateConversationDto {
  @ApiProperty({ example: 'Análise de vendas' })
  @IsString() @IsNotEmpty() @MaxLength(255)
  title: string;
}
