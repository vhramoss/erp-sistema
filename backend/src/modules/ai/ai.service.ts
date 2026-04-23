import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import { PrismaService } from '../../prisma/prisma.service';
import { ChatMessageDto } from './dto/ai.dto';

@Injectable()
export class AiService {
  private anthropic: Anthropic;
  private model: string;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    const apiKey = this.configService.get<string>('ANTHROPIC_API_KEY');
    if (!apiKey) throw new Error('ANTHROPIC_API_KEY não configurada');
    this.anthropic = new Anthropic({ apiKey });
    this.model = this.configService.get<string>('ANTHROPIC_MODEL', 'claude-haiku-4-5-20251001');
  }

  async chat(dto: ChatMessageDto, companyId: string) {
    const context = await this.getBusinessContext(companyId);

    let conversation = dto.conversationId
      ? await this.prisma.aiConversation.findFirst({
          where: { id: dto.conversationId, companyId },
          include: { messages: { orderBy: { createdAt: 'asc' }, take: 20 } },
        })
      : null;

    if (dto.conversationId && !conversation) {
      throw new NotFoundException('Conversa não encontrada');
    }

    if (!conversation) {
      const title = dto.message.substring(0, 60) + (dto.message.length > 60 ? '...' : '');
      conversation = await this.prisma.aiConversation.create({
        data: { title, companyId, messages: { create: [] } },
        include: { messages: true },
      });
    }

    const history = conversation.messages.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));

    const systemPrompt = `Você é um assistente de negócios especializado em ERP para pequenas e médias empresas.
Você tem acesso aos dados da empresa e pode ajudar com análises, relatórios e recomendações.

CONTEXTO DO NEGÓCIO (atualizado em ${new Date().toLocaleDateString('pt-BR')}):
${context}

INSTRUÇÕES:
- Responda sempre em português brasileiro
- Seja objetivo e profissional
- Use dados reais do contexto quando disponíveis
- Formate números como moeda brasileira (R$) quando necessário
- Sugira ações concretas e mensuráveis
- Não invente dados que não estão no contexto fornecido`;

    const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [
      ...history,
      { role: 'user', content: dto.message },
    ];

    const response = await this.anthropic.messages.create({
      model: this.model,
      max_tokens: 1024,
      system: systemPrompt,
      messages,
    });

    const assistantMessage = response.content[0].type === 'text' ? response.content[0].text : '';

    await this.prisma.aiMessage.createMany({
      data: [
        { role: 'user', content: dto.message, conversationId: conversation.id },
        { role: 'assistant', content: assistantMessage, conversationId: conversation.id },
      ],
    });

    await this.prisma.aiConversation.update({
      where: { id: conversation.id },
      data: { updatedAt: new Date() },
    });

    return {
      conversationId: conversation.id,
      message: assistantMessage,
      usage: response.usage,
    };
  }

  async getConversations(companyId: string) {
    return this.prisma.aiConversation.findMany({
      where: { companyId },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        title: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { messages: true } },
      },
    });
  }

  async getConversation(id: string, companyId: string) {
    const conversation = await this.prisma.aiConversation.findFirst({
      where: { id, companyId },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });
    if (!conversation) throw new NotFoundException('Conversa não encontrada');
    return conversation;
  }

  async deleteConversation(id: string, companyId: string) {
    const conversation = await this.prisma.aiConversation.findFirst({ where: { id, companyId } });
    if (!conversation) throw new NotFoundException('Conversa não encontrada');
    await this.prisma.aiConversation.delete({ where: { id } });
    return { message: 'Conversa removida com sucesso' };
  }

  private async getBusinessContext(companyId: string): Promise<string> {
    const [company, productStats, customerStats, orderStats, financialStats] = await Promise.all([
      this.prisma.company.findUnique({
        where: { id: companyId },
        select: { name: true, plan: true },
      }),
      this.prisma.product.aggregate({
        where: { companyId },
        _count: true,
        _sum: { stock: true },
      }),
      this.prisma.customer.count({ where: { companyId, isActive: true } }),
      this.prisma.order.aggregate({
        where: { companyId, createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
        _count: true,
        _sum: { total: true },
      }),
      this.prisma.financialTransaction.aggregate({
        where: { companyId, date: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
        _sum: { amount: true },
      }),
    ]);

    const lowStockProducts = await this.prisma.product.count({
      where: { companyId, isActive: true, stock: { lte: 5 } },
    });

    return `
Empresa: ${company?.name} (Plano: ${company?.plan})
Produtos ativos: ${productStats._count} | Estoque total: ${productStats._sum.stock || 0} unidades | Produtos com estoque baixo: ${lowStockProducts}
Clientes ativos: ${customerStats}
Pedidos (30 dias): ${orderStats._count} | Faturamento (30 dias): R$ ${Number(orderStats._sum.total || 0).toFixed(2)}
Movimentação financeira (30 dias): R$ ${Number(financialStats._sum.amount || 0).toFixed(2)}
    `.trim();
  }
}
