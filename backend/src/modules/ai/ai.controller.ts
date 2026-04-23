import { Controller, Get, Post, Body, Param, Delete, ParseUUIDPipe, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AiService } from './ai.service';
import { ChatMessageDto } from './dto/ai.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Throttle } from '@nestjs/throttler';

@ApiTags('ai')
@ApiBearerAuth('JWT')
@UseGuards(RolesGuard)
@Controller('v1/ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('chat')
  @Throttle({ default: { ttl: 60000, limit: 20 } })
  @ApiOperation({ summary: 'Enviar mensagem para o assistente IA' })
  chat(@Body() dto: ChatMessageDto, @CurrentUser('companyId') companyId: string) {
    return this.aiService.chat(dto, companyId);
  }

  @Get('conversations')
  @ApiOperation({ summary: 'Listar conversas' })
  getConversations(@CurrentUser('companyId') companyId: string) {
    return this.aiService.getConversations(companyId);
  }

  @Get('conversations/:id')
  @ApiOperation({ summary: 'Buscar conversa com mensagens' })
  getConversation(@Param('id', ParseUUIDPipe) id: string, @CurrentUser('companyId') companyId: string) {
    return this.aiService.getConversation(id, companyId);
  }

  @Delete('conversations/:id')
  @ApiOperation({ summary: 'Deletar conversa' })
  deleteConversation(@Param('id', ParseUUIDPipe) id: string, @CurrentUser('companyId') companyId: string) {
    return this.aiService.deleteConversation(id, companyId);
  }
}
